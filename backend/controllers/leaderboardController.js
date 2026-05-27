import Session from "#models/Session";
import User from "#models/User";

const LIMIT = 50;

function getPeriodFilter(period, offset = 0) {
  const now = new Date();

  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - offset);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCHours(23, 59, 59, 999);
      return offset === 0 ? { $gte: start } : { $gte: start, $lte: end };
    }
    case "week": {
      const mon = new Date(now);
      mon.setUTCDate(
        now.getUTCDate() - ((now.getUTCDay() + 6) % 7) - offset * 7,
      );
      mon.setUTCHours(0, 0, 0, 0);
      if (offset === 0) return { $gte: mon };
      const sun = new Date(mon);
      sun.setUTCDate(mon.getUTCDate() + 6);
      sun.setUTCHours(23, 59, 59, 999);
      return { $gte: mon, $lte: sun };
    }
    case "month": {
      const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
      );
      if (offset === 0) return { $gte: start };
      const end = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - offset + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      );
      return { $gte: start, $lte: end };
    }
    case "year": {
      const year = now.getUTCFullYear() - offset;
      const start = new Date(Date.UTC(year, 0, 1));
      if (offset === 0) return { $gte: start };
      const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      return { $gte: start, $lte: end };
    }
    case "allTime":
    default:
      return null;
  }
}

export async function getLeaderboard(req, res) {
  try {
    const period = req.query.period || "week";
    const MAX_OFFSET = 52;
    const offset = Math.min(
      Math.max(0, parseInt(req.query.offset, 10) || 0),
      MAX_OFFSET,
    );
    const dateFilter = getPeriodFilter(period, offset);

    const matchStage = { isRunning: false, isEdited: { $ne: true } };
    if (dateFilter) matchStage.startedAt = dateFilter;

    const rows = await Session.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$user",
          seconds: { $sum: "$durationSeconds" },
          sessions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
      { $match: { "userDoc.isActive": true } },
      { $sort: { seconds: -1 } },
      { $limit: LIMIT },
      { $project: { userDoc: 0 } },
    ]);

    if (!rows.length) {
      return res.json({ period, entries: [], myRank: null });
    }

    const userIds = rows.map((r) => r._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select(
        "name username avatar countryCode timezone plan isAdmin isDeveloper leaderboardPublic",
      )
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[String(u._id)] = u;
    });

    const entries = rows
      .filter((r) => userMap[String(r._id)])
      .map((r, i) => {
        const u = userMap[String(r._id)];
        const isPublic = u.leaderboardPublic !== false;
        return {
          rank: i + 1,
          userId: String(r._id),
          name: isPublic ? (u.name || null) : "Anonymous",
          username: isPublic ? (u.username || null) : null,
          avatar: isPublic ? (u.avatar || null) : null,
          countryCode: isPublic ? (u.countryCode || null) : null,
          timezone: isPublic ? (u.timezone || null) : null,
          plan: u.plan || "free",
          isAdmin: u.isAdmin ?? false,
          isDeveloper: u.isDeveloper ?? false,
          seconds: r.seconds,
          sessions: r.sessions,
        };
      });

    const myId = String(req.user._id);
    const myEntry = entries.find((e) => e.userId === myId);
    let myRank = myEntry ? myEntry.rank : null;

    if (!myEntry) {
      const myAgg = await Session.aggregate([
        { $match: { ...matchStage, user: req.user._id } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" } } },
      ]);
      if (myAgg.length && myAgg[0].seconds > 0) {
        const betterCount = await Session.aggregate([
          { $match: matchStage },
          { $group: { _id: "$user", seconds: { $sum: "$durationSeconds" } } },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          { $unwind: "$userDoc" },
          {
            $match: {
              seconds: { $gt: myAgg[0].seconds },
              "userDoc.isActive": true,
            },
          },
          { $count: "n" },
        ]);
        myRank = (betterCount[0]?.n ?? 0) + 1;
      }
    }

    res.json({ period, entries, myRank });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /leaderboard/aura?period=week|month|year|allTime&offset=0
// Top users by aura received in the given period.
// "allTime" reads directly from User.auraReceived (lifetime total).
export async function getAuraLeaderboard(req, res) {
  try {
    const period = req.query.period || "week";
    const limit = Math.min(Number(req.query.limit ?? 50), 50);

    // Aura is only tracked as a lifetime total; per-period leaderboards
    // would require a separate time-series collection. For now, every
    // period returns the same all-time ranking.
    const users = await User.find({ isActive: true })
      .select(
        "name username avatar countryCode timezone plan isAdmin isDeveloper auraReceived leaderboardPublic",
      )
      .sort({ auraReceived: -1 })
      .limit(limit)
      .lean();

    const entries = users.map((u, i) => {
      const isPublic = u.leaderboardPublic !== false;
      return {
        rank: i + 1,
        userId: String(u._id),
        name: isPublic ? (u.name || null) : "Anonymous",
        username: isPublic ? (u.username || null) : null,
        avatar: isPublic ? (u.avatar || null) : null,
        countryCode: isPublic ? (u.countryCode || null) : null,
        timezone: isPublic ? (u.timezone || null) : null,
        plan: u.plan || "free",
        isAdmin: u.isAdmin ?? false,
        isDeveloper: u.isDeveloper ?? false,
        auraReceived: u.auraReceived ?? 0,
      };
    });

    const myId = String(req.user._id);
    const myEntry = entries.find((e) => e.userId === myId);
    let myRank = myEntry?.rank ?? null;

    if (!myEntry) {
      const me = await User.findById(req.user._id)
        .select("auraReceived")
        .lean();
      if (me?.auraReceived > 0) {
        const betterCount = await User.countDocuments({
          isActive: true,
          auraReceived: { $gt: me.auraReceived },
        });
        myRank = betterCount + 1;
      }
    }

    const result = { period, entries, myRank };
    if (period !== "allTime") result.isAllTimeData = true;
    return res.json(result);
  } catch (err) {
    console.error("getAuraLeaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
