import express from "express";
import passport from "passport";
import { signToken } from "#utils/jwt";
import { langFromCountry } from "#constants/countryToLang";
import geoip from "geoip-lite";

const router = express.Router();

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() ?? req.ip ?? null;
}

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=failed`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const ip = getClientIp(req);
      const geo = ip ? geoip.lookup(ip) : null;
      const countryCode = geo?.country || null;

      user.lastIp = ip;
      user.lastSeenAt = new Date();

      // Only set country/language if geo has never been resolved before (new
      // account or legacy backfill). Must not overwrite on subsequent logins —
      // a user on a VPN or travelling would otherwise get the wrong language.
      // `geoResolved` is the latch: once true, this block is skipped forever,
      // even if countryCode itself is null (private IP / geoip miss in dev).
      if (!user.geoResolved) {
        user.countryCode = countryCode;
        user.countryName = countryCode
          ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode)
          : null;
        user.language = langFromCountry(countryCode);
        user.geoResolved = true;
      }

      if (!user.registrationIp) user.registrationIp = ip;

      await user.save();
    } catch (err) {
      console.error("Google callback geo update failed:", err.message);
    }

    const token = signToken(req.user._id, req.user.tokenVersion ?? 0);
    const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";

    res.cookie("auth_callback_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60 * 1000, // 5 minutes — single-use handoff only
      path: "/",
    });

    res.redirect(`${clientOrigin}/auth/callback`);
  },
);

// GET /auth/google/token
// The SPA hits this endpoint once after the OAuth redirect to exchange the
// short-lived HttpOnly cookie for its own in-memory JWT. The cookie is
// cleared immediately so it cannot be reused.
// googleRoutes.js → GET /token
router.get("/token", (req, res) => {
  const origin = req.headers.origin || req.headers.referer || "";
  const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  if (!origin.startsWith(clientOrigin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const token = req.cookies?.auth_callback_token;
  if (!token) return res.status(401).json({ error: "No pending auth token" });

  res.clearCookie("auth_callback_token", { path: "/" });
  res.json({ token });
});

export default router;
