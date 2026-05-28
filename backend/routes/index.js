import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  listDefaultTags,
  createDefaultTag,
  updateDefaultTag,
  deleteDefaultTag,
  reorderDefaultTags,
  getDefaultTags,
} from "#controllers/tagController";
import {
  protect,
  protectBeacon,
  requirePlan,
  requireAdmin,
  requireDeveloper,
} from "#middleware/auth";
// Removed hardcoded PAID_PLANS — dynamic feature checks now used in requirePlan
import * as auth from "#controllers/authController";
import { avatarUpload } from "#controllers/authController";
import * as tags from "#controllers/tagController";
import * as sessions from "#controllers/sessionController";
import {
  editSession,
  createSession as createSessionFromUI,
  deleteSession as deleteSessionFromUI,
} from "#controllers/sessionEditController";
import { importSessions } from "#controllers/sessionImportController";
import { adminImportSessions } from "#controllers/adminSessionImportController";
import * as analytics from "#controllers/analyticsController";
import * as exp from "#controllers/exportController";
import * as admin from "#controllers/adminController";
import {
  getLeaderboard,
  getAuraLeaderboard,
} from "#controllers/leaderboardController";
import * as aura from "#controllers/auraController";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later." },
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
});

const validateEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Too many requests, please try again later." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
});

const updateMeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later." },
});

const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
});

const destructiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." },
});

const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
});

const auraReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later." },
});

const auraGiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
});

const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many import requests, please try again later." },
});

const adminImportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many admin import requests, please try again later." },
});

router.post(
  "/auth/validate-email",
  validateEmailLimiter,
  auth.validateEmailStep,
);
router.post(
  "/auth/validate-username",
  validateEmailLimiter,
  auth.validateUsernameStep,
);
router.post("/auth/register", authLimiter, auth.register);
router.post("/auth/login", loginLimiter, auth.login);
router.post("/auth/google", loginLimiter, auth.googleAuth);
router.get("/auth/me", protect, auth.me);
router.patch("/auth/me", protect, updateMeLimiter, auth.updateMe);
router.post(
  "/auth/me/avatar",
  protect,
  avatarUpload.single("avatar"),
  auth.uploadAvatar,
);
router.post("/auth/change-password", protect, auth.changePassword);
router.post("/auth/create-password", protect, auth.createPassword);
router.post("/auth/claim-username", protect, auth.claimUsername);
router.post("/auth/logout-all", protect, destructiveLimiter, auth.logoutAll);
router.post(
  "/auth/delete-account",
  protect,
  destructiveLimiter,
  auth.deleteAccount,
);
router.get("/auth/verify-email", auth.verifyEmail);
router.post(
  "/auth/resend-verification",
  resendLimiter,
  auth.resendVerification,
);
router.post(
  "/auth/forgot-password",
  forgotPasswordLimiter,
  auth.forgotPassword,
);
router.post("/auth/reset-password", resetPasswordLimiter, auth.resetPassword);

router.get("/tags/defaults", protect, getDefaultTags);
router.patch(
  "/tags/defaults/:id/preference",
  protect,
  tags.updateDefaultTagPreference,
);
router.get("/tags", protect, tags.getTags);
router.post("/tags", protect, tags.createTag);
router.patch("/tags/reorder", protect, tags.reorderTags);
router.patch("/tags/:id", protect, tags.updateTag);
router.delete("/tags/:id", protect, tags.deleteTag);

router.get("/tags/:tagId/subtags", protect, tags.getSubTags);
router.post("/tags/:tagId/subtags", protect, tags.createSubTag);
router.patch("/tags/:tagId/subtags/reorder", protect, tags.reorderSubTags);
router.patch("/tags/:tagId/subtags/:id", protect, tags.updateSubTag);
router.delete("/tags/:tagId/subtags/:id", protect, tags.deleteSubTag);

router.get("/admin/default-tags", protect, requireAdmin, listDefaultTags);
router.post("/admin/default-tags", protect, requireDeveloper, createDefaultTag);
router.patch(
  "/admin/default-tags/reorder",
  protect,
  requireDeveloper,
  reorderDefaultTags,
);
router.patch(
  "/admin/default-tags/:id",
  protect,
  requireDeveloper,
  updateDefaultTag,
);
router.delete(
  "/admin/default-tags/:id",
  protect,
  requireDeveloper,
  deleteDefaultTag,
);
router.get("/admin/blocklist", protect, requireDeveloper, admin.listBlocklist);
router.post(
  "/admin/blocklist",
  protect,
  requireDeveloper,
  admin.addBlocklistDomain,
);
router.delete(
  "/admin/blocklist/:domain",
  protect,
  requireDeveloper,
  admin.removeBlocklistDomain,
);

router.get("/sessions", protect, sessions.getSessions);
router.get("/sessions/running", protect, sessions.getRunningSession);
router.post("/sessions/start", protect, sessions.startSession);
router.post("/sessions/import/:userId", protect, importLimiter, importSessions);
router.post("/sessions/:id/stop", protectBeacon, sessions.stopSession);
router.post("/sessions", protect, createSessionFromUI);
router.patch("/sessions/:id", protect, editSession);
router.delete("/sessions/:id", protect, deleteSessionFromUI);
router.post(
  "/sessions/delete-all",
  protect,
  destructiveLimiter,
  sessions.deleteAllUserData,
);

router.get("/analytics/overview", protect, analytics.overview);
router.get("/analytics/by-tag", protect, analytics.byTag);
router.get("/analytics/streaks", protect, analytics.streaks);
router.get("/analytics/weekly", protect, analytics.weekly);
router.get("/analytics/sessions", protect, analytics.daySessions);
router.get(
  "/analytics/heatmap",
  protect,
  requirePlan("heatmap"),
  analytics.heatmap,
);

// Static leaderboard routes before :userId wildcards
router.get("/leaderboard", protect, leaderboardLimiter, getLeaderboard);
router.get(
  "/leaderboard/aura",
  protect,
  leaderboardLimiter,
  getAuraLeaderboard,
);

router.get("/aura/me", protect, auraReadLimiter, aura.getMyAura);
router.get("/aura/leaderboard", protect, auraReadLimiter, aura.auraLeaderboard);
router.get("/aura/:userId", protect, auraReadLimiter, aura.getUserAura);
router.post("/aura/:userId/give", protect, auraGiveLimiter, aura.giveAura);

router.get("/export/csv", protect, exportLimiter, exp.exportCsv);

router.get("/admin/stats", protect, requireAdmin, admin.siteStats);
router.get("/admin/users", protect, requireAdmin, admin.listUsers);
router.patch("/admin/users/:id", protect, requireAdmin, admin.updateUser);
router.patch(
  "/admin/users/:id/developer",
  protect,
  requireDeveloper,
  admin.setDeveloperRole,
);

router.post(
  "/admin/sessions/import/:userId",
  protect,
  requireAdmin,
  adminImportLimiter,
  adminImportSessions,
);

export default router;
