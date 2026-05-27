import User from "#models/User";
import AuraDailyUsage, { nextUTCMidnight } from "#models/AuraDailyUsage";
import { DAILY_AURA_ALLOWANCE } from "#constants/aura";


// GET /aura/me
export async function getMyAura(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("auraReceived")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found." });

    const usage = await AuraDailyUsage.findOne({ userId: req.user._id })
      .select("used")
      .lean();

    // null → hasn't given today (reset happened), 0 is not a valid stored state
    const auraGivenToday = usage?.used ?? null;
    const auraToGive =
      auraGivenToday === null
        ? DAILY_AURA_ALLOWANCE
        : DAILY_AURA_ALLOWANCE - auraGivenToday;

    return res.json({
      auraReceived: user.auraReceived,
      auraGivenToday,
      auraToGive,
    });
  } catch (err) {
    console.error("getMyAura error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// GET /aura/:userId
export async function getUserAura(req, res) {
  try {
    const target = await User.findById(req.params.userId)
      .select("isActive auraReceived")
      .lean();

    if (!target || !target.isActive) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({
      userId: req.params.userId,
      auraReceived: target.auraReceived,
    });
  } catch (err) {
    console.error("getUserAura error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// POST /aura/:userId/give
// Body: { points?: number } — defaults to 1.
export async function giveAura(req, res) {
  try {
    const fromUserId = req.user._id;
    const { userId: toUserId } = req.params;
    const points = Number(req.body?.points ?? 1);

    if (!Number.isInteger(points) || points < 1) {
      return res
        .status(400)
        .json({ error: "points must be a positive integer." });
    }

    if (String(fromUserId) === String(toUserId)) {
      return res
        .status(400)
        .json({ error: "You cannot give aura to yourself." });
    }

    const target = await User.findById(toUserId)
      .select("isActive username name")
      .lean();
    if (!target || !target.isActive) {
      return res.status(404).json({ error: "User not found." });
    }

    const existing = await AuraDailyUsage.findOne({ userId: fromUserId })
      .select("used")
      .lean();

    // null doc means today's budget is fully fresh
    const usedToday = existing?.used ?? 0;
    const remaining = DAILY_AURA_ALLOWANCE - usedToday;

    if (remaining <= 0) {
      return res.status(429).json({
        error:
          "You have no aura left to give today. Your allowance resets at midnight UTC.",
        auraToGive: 0,
      });
    }

    const actualPoints = Math.min(points, remaining);

    if (existing) {
      // Atomically increment — guard against concurrent over-spend
      const updated = await AuraDailyUsage.findOneAndUpdate(
        {
          userId: fromUserId,
          used: { $lte: DAILY_AURA_ALLOWANCE - actualPoints },
        },
        { $inc: { used: actualPoints } },
        { returnDocument: "after", select: "used" },
      );

      if (!updated) {
        // Race condition: someone else incremented between our read and write
        const fresh = await AuraDailyUsage.findOne({ userId: fromUserId })
          .select("used")
          .lean();
        const freshRemaining = DAILY_AURA_ALLOWANCE - (fresh?.used ?? 0);
        return res.status(400).json({
          error: `You only have ${freshRemaining} aura point${freshRemaining !== 1 ? "s" : ""} left to give today.`,
          auraToGive: freshRemaining,
        });
      }
    } else {
      // First give of the day — create the usage doc with TTL set to next midnight
      try {
        await AuraDailyUsage.create({
          userId: fromUserId,
          used: actualPoints,
          expiresAt: nextUTCMidnight(),
        });
      } catch (dupErr) {
        // Race condition: another request created the doc between our findOne and create
        if (dupErr.code === 11000) {
          const fresh = await AuraDailyUsage.findOne({ userId: fromUserId })
            .select("used")
            .lean();
          const freshRemaining = DAILY_AURA_ALLOWANCE - (fresh?.used ?? 0);
          return res.status(400).json({
            error: `You only have ${freshRemaining} aura point${freshRemaining !== 1 ? "s" : ""} left to give today.`,
            auraToGive: freshRemaining,
          });
        }
        throw dupErr;
      }
    }

    await User.updateOne(
      { _id: toUserId },
      { $inc: { auraReceived: actualPoints } },
    );

    const displayName = target.username ?? target.name ?? "that user";
    const newUsed = (existing?.used ?? 0) + actualPoints;

    return res.status(201).json({
      message: `You gave ${actualPoints} aura point${actualPoints !== 1 ? "s" : ""} to ${displayName}.`,
      pointsGiven: actualPoints,
      auraToGive: DAILY_AURA_ALLOWANCE - newUsed,
    });
  } catch (err) {
    console.error("giveAura error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// GET /aura/leaderboard
export async function auraLeaderboard(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit ?? 20), 50);

    const users = await User.find({ isActive: true })
      .select("username name avatar auraReceived")
      .sort({ auraReceived: -1 })
      .limit(limit)
      .lean();

    const leaderboard = users.map((u) => ({
      userId: u._id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      auraReceived: u.auraReceived,
    }));

    return res.json({ leaderboard });
  } catch (err) {
    console.error("auraLeaderboard error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
