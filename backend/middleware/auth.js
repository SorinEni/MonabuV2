import { verifyToken } from "#utils/jwt";
import User from "#models/User";
import { getPlanConfigSync } from "#utils/plans";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Please log in" });
    }

    const token = authHeader.split(" ")[1];
    const { sub, ver } = verifyToken(token);

    const user = await User.findById(sub).select("-__v");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Reject tokens issued before the last logoutAll call.
    // ver is undefined on old tokens — treat those as version 0.
    if ((ver ?? 0) < user.tokenVersion) {
      return res
        .status(401)
        .json({ error: "Session expired, please log in again" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * protectBeacon
 *
 * A variant of `protect` for the POST /sessions/:id/stop route that also
 * accepts the JWT as a `?token=` query parameter.
 *
 * Why: navigator.sendBeacon() cannot set custom headers (browser limitation),
 * so the client appends the token to the URL instead when sending a beacon on
 * tab close. Normal requests still use the Authorization header as usual.
 *
 * This fallback is intentionally NOT added to the general `protect` middleware
 * — query-string tokens are only acceptable on this one fire-and-forget route.
 */
export async function protectBeacon(req, res, next) {
  try {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    // Query-param token is only accepted on POST (beacon sends POST).
    const queryToken =
      req.method === "POST" && typeof req.query.token === "string"
        ? req.query.token
        : null;

    const token = headerToken ?? queryToken;

    if (!token) {
      return res.status(401).json({ error: "Please log in" });
    }

    const { sub, ver } = verifyToken(token);

    const user = await User.findById(sub).select("-__v");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    if ((ver ?? 0) < user.tokenVersion) {
      return res
        .status(401)
        .json({ error: "Session expired, please log in again" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * requirePlan(feature)
 *
 * Dynamic plan enforcement middleware.
 * Checks the user's current plan config from the in-memory cache and:
 * 1. Rejects if the plan is not found.
 * 2. For non-lifetime plans, rejects if planExpiresAt has passed.
 * 3. If a feature string is provided, rejects if the plan lacks it.
 */
export const requirePlan = (feature) => (req, res, next) => {
  const config = getPlanConfigSync(req.user.plan);

  // Unknown plan in cache — allow admin/developer; for regular users, we
  // fail-open rather than silently treating them as free tier.
  if (!config) {
    if (req.user.isAdmin || req.user.isDeveloper) return next();
    return res.status(500).json({ error: "Plan configuration unavailable." });
  }

  if (!config.isLifetime) {
    const expires = req.user.planExpiresAt;
    if (expires && new Date() > new Date(expires)) {
      return res
        .status(403)
        .json({ error: "Subscription expired. Please renew your plan." });
    }
  }

  if (feature && !config.features.includes(feature)) {
    return res.status(403).json({
      error: "This feature requires an upgrade.",
      code: "PLAN_UPGRADE_REQUIRED",
    });
  }

  next();
};

// Admin OR Developer can pass
export const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin && !req.user.isDeveloper) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
};

// Developer only — absolute access, supersedes all other roles
export const requireDeveloper = (req, res, next) => {
  if (!req.user.isDeveloper) {
    return res.status(403).json({ error: "Developer access only" });
  }
  next();
};
