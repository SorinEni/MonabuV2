import User from "#models/User";
import Session from "#models/Session";
import bcrypt from "bcryptjs";
import {
  addToBlocklist,
  removeFromBlocklist,
  getBlocklist,
} from "#scripts/addToBlocklist";

const VALID_PLANS = ["free", "pro", "pro+", "team", "earlyaccess"];
const LIST_USERS_MAX_LIMIT = 100;
const BCRYPT_ROUNDS = 12;

//   GET /api/admin/stats
export async function siteStats(req, res) {
  try {
    const now = new Date();
    const day30 = new Date(now - 30 * 86400000);
    const day7 = new Date(now - 7 * 86400000);
    const day1 = new Date(now - 86400000);

    const [
      totalUsers,
      activeUsers30d,
      activeUsers7d,
      activeUsers1d,
      newUsers30d,
      newUsers7d,
      planBreakdown,
      totalSessions,
      sessions30d,
      totalHoursAgg,
      hours30dAgg,
      runningNow,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeenAt: { $gte: day30 } }),
      User.countDocuments({ lastSeenAt: { $gte: day7 } }),
      User.countDocuments({ lastSeenAt: { $gte: day1 } }),
      User.countDocuments({ createdAt: { $gte: day30 } }),
      User.countDocuments({ createdAt: { $gte: day7 } }),
      User.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
      Session.countDocuments({ isRunning: false }),
      Session.countDocuments({ isRunning: false, startedAt: { $gte: day30 } }),
      Session.aggregate([
        { $match: { isRunning: false } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" } } },
      ]),
      Session.aggregate([
        { $match: { isRunning: false, startedAt: { $gte: day30 } } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" } } },
      ]),
      Session.countDocuments({ isRunning: true }),
    ]);

    const plans = { free: 0, pro: 0, "pro+": 0, earlyaccess: 0, team: 0 };
    planBreakdown.forEach((p) => {
      if (p._id) plans[p._id] = p.count;
    });

    res.json({
      users: {
        total: totalUsers,
        active30d: activeUsers30d,
        active7d: activeUsers7d,
        active1d: activeUsers1d,
        new30d: newUsers30d,
        new7d: newUsers7d,
        plans,
      },
      sessions: {
        total: totalSessions,
        last30d: sessions30d,
        runningNow,
        totalHours: +((totalHoursAgg[0]?.seconds ?? 0) / 3600).toFixed(1),
        hours30d: +((hours30dAgg[0]?.seconds ?? 0) / 3600).toFixed(1),
      },
    });
  } catch (err) {
    // schema details, query structure, or stack traces.
    console.error("siteStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

//   GET /api/admin/users
export async function listUsers(req, res) {
  try {
    const { page = 1, plan, search } = req.query;
    const limit = Math.min(Number(req.query.limit) || 50, LIST_USERS_MAX_LIMIT);

    const filter = {};
    if (plan) filter.plan = plan;
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ email: re }, { name: re }, { username: re }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({
      users: users.map((u) => u.toAdmin()),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

//   PATCH /api/admin/users/:id
export async function updateUser(req, res) {
  try {
    const {
      plan,
      isActive,
      isAdmin,
      isDeveloper,
      name,
      username,
      email,
      password,
    } = req.body;
    const updates = {};

    if (plan !== undefined) {
      if (!VALID_PLANS.includes(plan)) {
        return res.status(400).json({ error: `Invalid plan: ${plan}` });
      }
      updates.plan = plan;
    }

    if (isActive !== undefined) updates.isActive = isActive;

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed)
        return res.status(400).json({ error: "Name cannot be empty" });
      updates.name = trimmed;
    }

    if (username !== undefined) {
      if (!req.user.isDeveloper) {
        return res
          .status(403)
          .json({ error: "Only Developers can change usernames" });
      }
      const trimmed = username.trim().toLowerCase();
      if (trimmed && (trimmed.length < 2 || trimmed.length > 32)) {
        return res
          .status(400)
          .json({ error: "Username must be 2–32 characters" });
      }
      if (trimmed && !/^[a-z0-9_.-]+$/.test(trimmed)) {
        return res
          .status(400)
          .json({ error: "Username contains invalid characters" });
      }
      if (trimmed) {
        const existing = await User.findOne({
          username: trimmed,
          _id: { $ne: req.params.id },
        });
        if (existing)
          return res.status(400).json({ error: "Username already taken" });
      }
      // Empty string clears the username field
      updates.username = trimmed || null;
      if (trimmed) updates.tempUsername = false;
    }

    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed)
        return res.status(400).json({ error: "Email cannot be empty" });

      const existing = await User.findOne({
        email: trimmed,
        _id: { $ne: req.params.id },
      });
      if (existing)
        return res.status(400).json({ error: "Email already in use" });

      if (req.user.isDeveloper) {
        updates.email = trimmed;
      } else {
        updates.pendingEmail = trimmed;
      }
    }

    if (isAdmin !== undefined) {
      if (!req.user.isDeveloper) {
        return res
          .status(403)
          .json({ error: "Only Developers can change the Admin role" });
      }
      updates.isAdmin = isAdmin;
    }

    if (isDeveloper !== undefined) {
      if (!req.user.isDeveloper) {
        return res
          .status(403)
          .json({ error: "Only Developers can change the Developer role" });
      }
      if (
        String(req.params.id) === String(req.user._id) &&
        isDeveloper === true
      ) {
        return res
          .status(403)
          .json({ error: "Cannot grant yourself Developer role" });
      }
      updates.isDeveloper = isDeveloper;
    }

    if (password !== undefined) {
      if (!req.user.isDeveloper) {
        return res
          .status(403)
          .json({ error: "Only Developers can reset passwords" });
      }
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      updates.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });

    if (target.isDeveloper && !req.user.isDeveloper) {
      return res
        .status(403)
        .json({ error: "Admins cannot modify Developer accounts" });
    }

    if (updates.isActive === false || updates.isDeveloper === false) {
      updates.tokenVersion = (target.tokenVersion ?? 0) + 1;
    }

    Object.assign(target, updates);
    await target.save();

    res.json({ user: target.toAdmin() });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(400).json({ error: "Bad request" });
  }
}

//   PATCH /api/admin/users/:id/developer  (Developer only)
export async function setDeveloperRole(req, res) {
  try {
    const { isDeveloper } = req.body;
    if (typeof isDeveloper !== "boolean") {
      return res.status(400).json({ error: "isDeveloper must be a boolean" });
    }

    if (req.params.id === String(req.user._id) && !isDeveloper) {
      return res
        .status(400)
        .json({ error: "You cannot revoke your own Developer role" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });

    const updatePayload = { isDeveloper };
    if (!isDeveloper) {
      updatePayload.tokenVersion = (target.tokenVersion ?? 0) + 1;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user: user.toAdmin() });
  } catch (err) {
    console.error("setDeveloperRole error:", err);
    res.status(400).json({ error: "Bad request" });
  }
}

//   GET /api/admin/blocklist
export async function listBlocklist(req, res) {
  try {
    res.json({ domains: getBlocklist() });
  } catch (err) {
    console.error("listBlocklist error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

//   POST /api/admin/blocklist
export async function addBlocklistDomain(req, res) {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "domain is required" });
    }
    const result = addToBlocklist(domain);
    if (!result.added) {
      return res.status(409).json({ error: "Domain is already blocked" });
    }
    res.status(201).json({ domain: result.domain });
  } catch (err) {
    console.error("addBlocklistDomain error:", err);
    res.status(400).json({ error: "Bad request" });
  }
}

//   DELETE /api/admin/blocklist/:domain
export async function removeBlocklistDomain(req, res) {
  try {
    const result = removeFromBlocklist(req.params.domain);
    if (!result.removed) {
      return res.status(404).json({ error: "Domain not found in blocklist" });
    }
    res.json({ domain: result.domain });
  } catch (err) {
    console.error("removeBlocklistDomain error:", err);
    res.status(400).json({ error: "Bad request" });
  }
}
