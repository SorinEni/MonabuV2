import crypto from "node:crypto";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";
import User from "#models/User";
import Session from "#models/Session";
import Tag from "#models/Tag";
import SubTag from "#models/SubTag";
import UserDefaultTagPreference from "#models/UserDefaultTagPreference";
import { signToken } from "#utils/jwt";
import geoip from "geoip-lite";
import { generateTempUsername } from "#utils/usernameGenerator";
import { langFromCountry } from "#constants/countryToLang";
import { isDomainBlocked } from "#scripts/addToBlocklist";
import {
  sendVerificationEmail,
  sendResendVerificationEmail,
  sendPasswordResetEmail,
} from "#utils/mailer";

const require = createRequire(import.meta.url);
const disposableDomains = require("disposable-email-domains");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Roles allowed to use gifs as profile pictures
const GIF_ALLOWED_PLANS = new Set(["pro", "pro+", "team", "earlyaccess"]);

//  Password reset token helpers
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

//  Verification token helpers
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

// Name change cooldown
const NAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 1 month

// Period after which user account gets permanently deleted
const DELETION_GRACE_DAYS = 30; //1 month

//  Avatar upload directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.resolve(__dirname, "..");
const AVATAR_DIR = path.join(ROOT, "uploads/avatars");

fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_AVATAR_MIMETYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB cap — route handler enforces 5 MB for non-GIF images
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_AVATAR_MIMETYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
    }
    cb(null, true);
  },
});

//  Email validation
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

function normalizeEmail(email) {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split("@");
  if (GMAIL_DOMAINS.has(domain)) {
    return `${local.replace(/\./g, "")}@${domain}`;
  }
  return trimmed;
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() ?? req.ip ?? null;
}

function updateActivity(user, req) {
  const ip = getClientIp(req);
  user.lastIp = ip;
  user.lastSeenAt = new Date();

  // Language and country are set once — on the very first login — and must
  // never be overwritten on subsequent logins. A user on a VPN or travelling
  // abroad should not have their language silently changed.
  // `geoResolved` acts as a one-time latch: once set (even to "unknown") the
  // block is skipped forever, so a private/loopback IP in dev doesn't cause
  // repeated re-runs that always produce "en".
  if (!user.geoResolved) {
    const geo = ip ? geoip.lookup(ip) : null;
    const countryCode = geo?.country || null;
    user.countryCode = countryCode;
    user.countryName = countryCode
      ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode)
      : null;
    user.language = langFromCountry(countryCode);
    user.geoResolved = true;
  }
}

function validateEmailFormat(email) {
  if (!email || typeof email !== "string") {
    return "Email is required";
  }

  const trimmed = normalizeEmail(email);
  const atIndex = trimmed.indexOf("@");

  if (atIndex === -1 || trimmed.indexOf("@", atIndex + 1) !== -1) {
    return "Email must be in the format name@domain.com";
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (local.includes("+")) return "Email aliases with + are not allowed";
  if (local.startsWith(".") || local.endsWith(".") || local.includes(".."))
    return "Email format is invalid";
  if (!/^[a-z0-9._-]+$/.test(local)) return "Email format is invalid";
  if (!domain.includes("."))
    return "Email must be in the format name@domain.com";
  if (
    domain.startsWith(".") ||
    domain.endsWith(".") ||
    domain.startsWith("-") ||
    domain.includes("..")
  )
    return "Email format is invalid";

  const tld = domain.split(".").pop();
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld))
    return "Email must have a valid domain extension (e.g. .com, .net)";
  if (isDomainBlocked(domain)) return "This email domain is not allowed.";

  if (!/^[a-z0-9.-]+$/.test(domain)) return "Email format is invalid";

  return null; // valid
}

//  Disposable domain check
const disposableSet = new Set(disposableDomains);

function isDisposableDomain(domain) {
  return disposableSet.has(domain.toLowerCase());
}

//  MX record check
async function hasMxRecords(domain) {
  try {
    const records = await dns.promises.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    if (err.code === "ENODATA" || err.code === "ENOTFOUND") return false;
    console.warn(`MX lookup failed for ${domain}: ${err.message}`);
    return true; // fail open on transient DNS errors
  }
}

function attachVerificationToken(user) {
  const raw = crypto.randomBytes(32).toString("hex");
  user.verificationToken = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
  user.verificationTokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
  return raw;
}

function attachResetToken(user) {
  const raw = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
  user.resetPasswordTokenExpiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_MS,
  );
  return raw;
}

//  Auth response helper
function respond(res, user) {
  const token = signToken(user._id, user.tokenVersion ?? 0);
  res.json({ token, user: user.toPublic() });
}

//  POST /api/auth/validate-email
// email pre-check called on "Next" in the signup flow.
// Runs format + disposable + MX + duplicate checks without creating an account.
export async function validateEmailStep(req, res) {
  try {
    const { email } = req.body;

    const formatError = validateEmailFormat(email);
    if (formatError) return res.status(400).json({ error: formatError });

    const normalizedEmail = normalizeEmail(email);
    const domain = normalizedEmail.split("@")[1];

    if (isDisposableDomain(domain)) {
      return res.status(400).json({
        error:
          "Disposable email addresses are not allowed. Please use your real email.",
      });
    }

    if (isDomainBlocked(domain)) {
      return res
        .status(400)
        .json({ error: "This email domain is not allowed." });
    }

    const mxOk = await hasMxRecords(domain);
    if (!mxOk) {
      return res.status(400).json({
        error:
          "This email domain doesn't appear to exist. Please check for typos.",
      });
    }

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/validate-username
export async function validateUsernameStep(req, res) {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    const cleaned = username.trim().toLowerCase();

    if (cleaned.length < 2 || cleaned.length > 32) {
      return res
        .status(400)
        .json({ error: "Username must be between 2 and 32 characters" });
    }

    if (!/^[a-z0-9_.-]+$/.test(cleaned)) {
      return res.status(400).json({
        error:
          "Username may only contain letters, numbers, and the symbols . _ -",
      });
    }

    const taken = await User.findOne({ username: cleaned }).lean();
    if (taken) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/register
export async function register(req, res) {
  try {
    const {
      email,
      password,
      name,
      username,
      primaryGoal,
      weeklyHourGoal,
      timezone,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailError = validateEmailFormat(email);
    if (emailError) return res.status(400).json({ error: emailError });

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const domain = normalizedEmail.split("@")[1];

    if (isDisposableDomain(domain)) {
      return res
        .status(400)
        .json({ error: "Disposable email addresses are not allowed." });
    }

    const mxOk = await hasMxRecords(domain);
    if (!mxOk) {
      return res
        .status(400)
        .json({ error: "This email domain doesn't appear to exist." });
    }
    const isBlocked = isDomainBlocked(domain);
    if (isBlocked) {
      return res
        .status(400)
        .json({ error: "This email domain is not allowed." });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    //  Username: use the provided one or auto-generate a temporary one
    let resolvedUsername = null;
    let isTempUsername = false;

    if (username) {
      const cleaned = username.trim().toLowerCase();
      if (cleaned.length < 2 || cleaned.length > 32) {
        return res
          .status(400)
          .json({ error: "Username must be between 2 and 32 characters" });
      }
      if (!/^[a-z0-9_.-]+$/.test(cleaned)) {
        return res.status(400).json({
          error:
            "Username may only contain letters, numbers, and the symbols . _ -",
        });
      }
      const taken = await User.findOne({ username: cleaned });
      if (taken)
        return res.status(409).json({ error: "Username is already taken" });
      resolvedUsername = cleaned;
    } else {
      // No username supplied — generate a friendly temp one (e.g. "fluffy-bunny-4821")
      resolvedUsername = await generateTempUsername();
      isTempUsername = true;
    }

    const user = new User({
      email: normalizedEmail,
      passwordHash: password,
      name,
      username: resolvedUsername,
      tempUsername: isTempUsername,
      primaryGoal,
      weeklyHourGoal: weeklyHourGoal ?? 80,
      timezone: timezone || "UTC",
      isVerified: false,
    });

    const regIp = getClientIp(req);
    const geo = regIp ? geoip.lookup(regIp) : null;
    const countryCode = geo?.country || null;
    user.registrationIp = regIp;
    user.lastIp = regIp;
    user.countryCode = countryCode;
    user.countryName = countryCode
      ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode)
      : null;
    user.language = langFromCountry(countryCode);
    user.geoResolved = true; // lock — never overwrite language/country again
    const rawToken = attachVerificationToken(user);
    await user.save();

    sendVerificationEmail(normalizedEmail, rawToken).catch((err) =>
      console.error("Verification email failed:", err.message),
    );

    res.status(201).json({
      message:
        "Account created. Please check your email to verify your account.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    updateActivity(user, req);
    await user.save(); // persist lastSeenAt / lastIp updates
    respond(res, user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  GET /api/auth/verify-email?token=...
export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      verificationToken: hashed,
      verificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Verification link is invalid or has expired.",
        code: "INVALID_OR_EXPIRED_TOKEN",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    respond(res, user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/resend-verification
export async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: normalizeEmail(email) });

    // Always return the same message — don't reveal if the email exists
    if (!user || user.isVerified || user.googleId) {
      return res.json({
        message:
          "If that email has a pending verification, a new link has been sent.",
      });
    }

    const tokenIssuedAt =
      user.verificationTokenExpiresAt &&
      new Date(user.verificationTokenExpiresAt.getTime() - TOKEN_EXPIRY_MS);

    if (
      tokenIssuedAt &&
      Date.now() - tokenIssuedAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        error:
          "Please wait a moment before requesting another verification email.",
      });
    }

    const rawToken = attachVerificationToken(user);
    await user.save();

    sendResendVerificationEmail(user.email, rawToken).catch((err) =>
      console.error("Resend verification email failed:", err.message),
    );

    res.json({
      message:
        "If that email has a pending verification, a new link has been sent.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/forgot-password
export async function forgotPassword(req, res) {
  const GENERIC_MSG =
    "If an account exists for that email, a reset link has been sent.";

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const formatError = validateEmailFormat(email);
    if (formatError) return res.status(400).json({ error: formatError });

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    // Silently bail for unknown / unverified / inactive / Google-only accounts
    if (!user || !user.isActive || !user.isVerified || !user.passwordHash) {
      return res.json({ message: GENERIC_MSG });
    }

    const raw = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(raw).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await User.updateOne(
      { _id: user._id },
      { resetPasswordToken: hashed, resetPasswordTokenExpiresAt: expiresAt },
    );

    sendPasswordResetEmail(normalizedEmail, raw).catch((err) =>
      console.error("Password reset email failed:", err.message),
    );

    res.json({ message: GENERIC_MSG });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/reset-password
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ error: "Reset token is missing", code: "INVALID_TOKEN" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Reset link is invalid or has expired.",
        code: "INVALID_TOKEN",
      });
    }

    // authController.js → resetPassword
    user.passwordHash = password;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    respond(res, user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/google
export async function googleAuth(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        // Existing email/password account — link Google and mark verified
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        user.isVerified = true;
        await user.save();
      }
    } else {
      // Brand-new Google registration — capture IP/geo and assign a temp username
      const regIp = getClientIp(req);
      const geo = regIp ? geoip.lookup(regIp) : null;
      const countryCode = geo?.country || null;
      const tempUsernameValue = await generateTempUsername();

      user = await User.create({
        googleId,
        email,
        name,
        avatar: picture,
        isVerified: true,
        username: tempUsernameValue,
        tempUsername: true,
        registrationIp: regIp,
        lastIp: regIp,
        countryCode,
        countryName: countryCode
          ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode)
          : null,
        language: langFromCountry(countryCode),
        geoResolved: true, // lock — never overwrite language/country again
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    updateActivity(user, req);
    await user.save();
    respond(res, user);
  } catch (err) {
    res
      .status(401)
      .json({ error: "Google authentication failed: " + err.message });
  }
}

//  GET /api/auth/me
export async function me(req, res) {
  res.json({ user: req.user.toPublic() });
}

//  PATCH /api/auth/me
// Only writes fields that have actually changed.
// Prevents unnecessary DB writes when the submitted values are unchanged.
// Each field is validated before being applied.
export async function updateMe(req, res) {
  try {
    const allowed = [
      "none",
      "work",
      "school",
      "fitness",
      "learning",
      "reading",
      "habits",
      "productivity",
    ];

    const updates = {};

    for (const key of allowed) {
      if (!Object.prototype.hasOwnProperty.call(req.body, key)) continue;
      const incoming = req.body[key];
      const current = req.user[key];

      // pomoSettings — deep compare each sub-field individually
      if (key === "pomoSettings") {
        const changed =
          !incoming ||
          !current ||
          Object.keys(incoming).some((k) => incoming[k] !== current[k]);
        if (changed) updates[key] = incoming;
        continue;
      }

      // All other scalar fields — skip if value is identical
      if (incoming === current) continue;
      updates[key] = incoming;
    }

    // Name: trim both sides before comparing, then enforce cooldown only on a
    // genuine change — prevents saving the same name from touching the cooldown
    if (updates.name !== undefined) {
      const trimmedNew = (updates.name ?? "").trim();
      const trimmedCurrent = (req.user.name ?? "").trim();

      if (trimmedNew === trimmedCurrent) {
        // No real change — drop it entirely
        delete updates.name;
      } else {
        const last = req.user.nameLastChangedAt;
        if (
          last &&
          Date.now() - new Date(last).getTime() < NAME_CHANGE_COOLDOWN_MS
        ) {
          return res.status(429).json({
            error: "Display name can only be changed once per month.",
          });
        }
        updates.nameLastChangedAt = new Date();
      }
    }

    // Username — only allowed while tempUsername is true
    if (Object.prototype.hasOwnProperty.call(req.body, "username")) {
      const cleaned = (req.body.username ?? "").trim().toLowerCase();

      if (!req.user.tempUsername) {
        return res.status(403).json({
          error:
            "Username has already been permanently set and cannot be changed",
        });
      }
      if (cleaned.length < 2 || cleaned.length > 32) {
        return res.status(400).json({
          error: "Username must be between 2 and 32 characters",
        });
      }
      if (!/^[a-z0-9_.-]+$/.test(cleaned)) {
        return res.status(400).json({
          error:
            "Username may only contain letters, numbers, and the symbols . _ -",
        });
      }
      if (cleaned !== req.user.username) {
        const taken = await User.findOne({
          username: cleaned,
          _id: { $ne: req.user._id },
        }).lean();
        if (taken) {
          return res.status(409).json({ error: "Username is already taken" });
        }
        updates.username = cleaned;
      }

      updates.tempUsername = false;
    }

    // Email change: validate before applying
    // Email changes are handled separately — validate format, check for
    // conflicts, then store as pendingEmail (requires confirmation flow).
    if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
      const newEmail = (req.body.email ?? "").trim().toLowerCase();
      const currentEmail = (req.user.email ?? "").trim().toLowerCase();

      if (newEmail && newEmail !== currentEmail) {
        const formatError = validateEmailFormat(newEmail);
        if (formatError) return res.status(400).json({ error: formatError });

        const domain = newEmail.split("@")[1];
        if (isDisposableDomain(domain)) {
          return res.status(400).json({
            error: "Disposable email addresses are not allowed.",
          });
        }

        const conflict = await User.findOne({
          email: newEmail,
          _id: { $ne: req.user._id },
        }).lean();
        if (conflict) {
          return res
            .status(409)
            .json({ error: "An account with this email already exists." });
        }

        // Stage the change — actual promotion happens in a separate confirmation endpoint
        updates.pendingEmail = newEmail;
      }
    }

    // Language — validate against a 2-letter code
    if (updates.language !== undefined) {
      const lang = (updates.language || "").trim().toLowerCase();
      if (!/^[a-z]{2}$/.test(lang)) {
        return res.status(400).json({
          error: "Language must be a 2-letter code (e.g. en, de, fr)",
        });
      }
      if (lang === (req.user.language || "").toLowerCase()) {
        delete updates.language;
      } else {
        updates.language = lang;
      }
    }

    // Nothing changed — return the current user without a DB write
    if (Object.keys(updates).length === 0) {
      return res.json({ user: req.user.toPublic() });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );

    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

//  POST /api/auth/me/avatar
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const isGif = req.file.mimetype === "image/gif";

    if (!isGif && req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        error:
          "Non-GIF images must be under 5 MB. Try a smaller file or compress it.",
      });
    }

    if (isGif && !GIF_ALLOWED_PLANS.has(req.user.plan)) {
      return res.status(403).json({
        error:
          "Animated GIF avatars are a Pro feature. Please upgrade your plan.",
        code: "GIF_REQUIRES_PRO",
      });
    }

    const ext = isGif ? "gif" : "jpg";

    const hash = crypto
      .createHash("sha256")
      .update(`${req.user._id}-${Date.now()}`)
      .digest("hex")
      .slice(0, 32);
    const filename = `${hash}.${ext}`;
    const dest = path.join(AVATAR_DIR, filename);

    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    fs.writeFileSync(dest, req.file.buffer);

    // Delete old local avatar (Google URLs are remote — don't touch them)
    const prevAvatar = req.user.avatar;
    if (prevAvatar && prevAvatar.startsWith("/uploads/avatars/")) {
      const prevPath = path.join(ROOT, prevAvatar);
      fs.unlink(prevPath, () => {});
    }

    const avatarUrl = `/uploads/avatars/${filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: avatarUrl } },
      { returnDocument: "after" },
    );

    res.json({ avatar: avatarUrl, user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/change-password
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords are required" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user.passwordHash) {
      return res.status(400).json({
        error: "This account uses Google sign-in — use Create Password instead",
        code: "NO_PASSWORD",
      });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const sameAsOld = await user.comparePassword(newPassword);
    if (sameAsOld) {
      return res.status(400).json({
        error: "New password must be different from your current password",
      });
    }

    user.passwordHash = newPassword; // pre-save hook hashes it
    await user.save();

    res.json({
      message: "Password updated successfully",
      user: user.toPublic(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/create-password
// Allows Google-only users to set a password for the first time so they
// can also log in with email + password
export async function createPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);
    if (user.passwordHash) {
      return res.status(400).json({
        error:
          "This account already has a password. Use change-password instead.",
        code: "PASSWORD_EXISTS",
      });
    }

    user.passwordHash = password; // pre-save hook hashes it
    await user.save();

    res.json({
      message: "Password created successfully",
      user: user.toPublic(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/claim-username
// Lets a user with a temporary auto-generated username (tempUsername: true)
// permanently claim a real one. Can only be done once
// after that the username is locked and can only be changed by an admin.
export async function claimUsername(req, res) {
  try {
    const { username } = req.body;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    const cleaned = username.trim().toLowerCase();

    if (cleaned.length < 2 || cleaned.length > 32) {
      return res
        .status(400)
        .json({ error: "Username must be between 2 and 32 characters" });
    }

    if (!/^[a-z0-9_.-]+$/.test(cleaned)) {
      return res.status(400).json({
        error:
          "Username may only contain letters, numbers, and the symbols . _ -",
      });
    }

    const user = await User.findById(req.user._id);

    // If the submitted username is already theirs (temp or not), it's a no-op
    if (user.username === cleaned) {
      // If it was still marked temp, locking it is valid even without a change
      if (user.tempUsername) {
        user.tempUsername = false;
        await user.save();
      }
      return res.json({ user: user.toPublic() });
    }

    if (!user.tempUsername) {
      return res.status(403).json({
        error:
          "Username has already been permanently set and cannot be changed",
      });
    }

    const taken = await User.findOne({
      username: cleaned,
      _id: { $ne: user._id },
    });
    if (taken) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    user.username = cleaned;
    user.tempUsername = false; // lock permanently
    await user.save();

    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/logout-all
// Invalidates every JWT ever issued to this account by incrementing tokenVersion.
// The protect middleware rejects any token whose `ver` is lower than the current value.
// All devices are kicked out instantly.
export async function logoutAll(req, res) {
  try {
    const user = await User.findById(req.user._id);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    res.json({ message: "All sessions have been logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//  POST /api/auth/delete-account
// Schedules the account for deletion in 30 days.
//     - isActive → false   blocks all logins immediately
//     - scheduledDeletionAt → now + 30 days
//     - tokenVersion bumped  invalidates all active JWTs

//   After 30 days, MongoDB's TTL index on `scheduledDeletionAt` automatically
//   hard-deletes the User document.

//   All user data (sessions, tags, subtags, preferences) is deleted
//   immediately so nothing is retained during the grace period.
//   Support can reactivate by clearing isActive=false and
//   scheduledDeletionAt=null — the user will start with a clean slate.
export async function deleteAccount(req, res) {
  try {
    const { confirm } = req.body;
    if (confirm !== "DELETE") {
      return res.status(400).json({
        error: 'Send { confirm: "DELETE" } to confirm account deletion',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + DELETION_GRACE_DAYS);

    //  Wipe all user data immediately
    await Promise.all([
      Session.deleteMany({ user: user._id }),
      Tag.deleteMany({ user: user._id }),
      SubTag.deleteMany({ user: user._id }),
      UserDefaultTagPreference.deleteMany({ user: user._id }),
    ]);

    user.isActive = false;
    user.scheduledDeletionAt = deletionDate;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;

    await user.save();

    res.json({
      message: `Your account has been deactivated and will be permanently deleted on ${deletionDate.toISOString().slice(0, 10)}. Contact support before then if this was a mistake.`,
      scheduledDeletionAt: deletionDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
