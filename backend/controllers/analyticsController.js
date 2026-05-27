import Session from "#models/Session";
import { getPlanConfigSync } from "#utils/plans";

// ------------------------------------------------------------------
// Plan / window helpers
// ------------------------------------------------------------------

function getPlanAnalyticsMeta(req) {
  const config = getPlanConfigSync(req.user.plan);
  const hasFull = config?.features?.includes("full_analytics") ?? true;
  let minDate = null;
  let isLimited = false;
  if (config?.analyticsDays != null) {
    minDate = new Date();
    minDate.setUTCDate(minDate.getUTCDate() - config.analyticsDays);
    minDate.setUTCHours(0, 0, 0, 0);
    isLimited = true;
  }
  return { config, hasFull, minDate, isLimited, maxDays: config?.analyticsDays ?? null };
}

// ------------------------------------------------------------------
// Timezone helpers
// ------------------------------------------------------------------

/** Return the user's IANA timezone string, validated, falling back to UTC. */
function userTz(req) {
  const tz = req.user?.timezone || "UTC";
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** Zero the time part of a UTC date (used for coarse range queries). */
function dayStart(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ------------------------------------------------------------------
// GET /api/analytics/overview
// ------------------------------------------------------------------

export async function overview(req, res) {
  try {
    const userId = req.user._id;
    const tz = userTz(req);
    const now = new Date();
    const { hasFull, minDate, isLimited, maxDays } = getPlanAnalyticsMeta(req);

    const todayStart = dayStart(now);
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
    weekStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const yearStart = new Date(now.getUTCFullYear(), 0, 1);

    const baseMatch = { user: userId, isRunning: false };
    if (minDate) baseMatch.startedAt = { $gte: minDate };

    const baseAggs = [
      // 0 — today
      Session.aggregate([
        { $match: { ...baseMatch, startedAt: { $gte: todayStart } } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, sessions: { $sum: 1 } } },
      ]),
      // 1 — this week
      Session.aggregate([
        { $match: { ...baseMatch, startedAt: { $gte: weekStart } } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, sessions: { $sum: 1 } } },
      ]),
      // 2 — this month
      Session.aggregate([
        { $match: { ...baseMatch, startedAt: { $gte: monthStart } } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, sessions: { $sum: 1 } } },
      ]),
      // 3 — this year
      Session.aggregate([
        { $match: { ...baseMatch, startedAt: { $gte: yearStart } } },
        { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, sessions: { $sum: 1 } } },
      ]),
    ];

    const advancedAggs = hasFull
      ? [
          // 4 — all time
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            { $group: { _id: null, seconds: { $sum: "$durationSeconds" }, count: { $sum: 1 } } },
          ]),
          // 5 — best day
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: {
                  y: { $year: { date: "$startedAt", timezone: tz } },
                  m: { $month: { date: "$startedAt", timezone: tz } },
                  d: { $dayOfMonth: { date: "$startedAt", timezone: tz } },
                },
                seconds: { $sum: "$durationSeconds" },
                sessions: { $sum: 1 },
              },
            },
            { $sort: { seconds: -1 } },
            { $limit: 1 },
          ]),
          // 6 — avg session
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: null,
                avgSeconds: { $avg: "$durationSeconds" },
                total: { $sum: 1 },
              },
            },
          ]),
          // 7 — worst day
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: {
                  y: { $year: { date: "$startedAt", timezone: tz } },
                  m: { $month: { date: "$startedAt", timezone: tz } },
                  d: { $dayOfMonth: { date: "$startedAt", timezone: tz } },
                },
                seconds: { $sum: "$durationSeconds" },
                sessions: { $sum: 1 },
              },
            },
            { $match: { seconds: { $gt: 0 } } },
            { $sort: { seconds: 1 } },
            { $limit: 1 },
          ]),
          // 8 — best week
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: {
                  week: { $week: { date: "$startedAt", timezone: tz } },
                  year: { $year: { date: "$startedAt", timezone: tz } },
                },
                seconds: { $sum: "$durationSeconds" },
                sessions: { $sum: 1 },
              },
            },
            { $sort: { seconds: -1 } },
            { $limit: 1 },
          ]),
          // 9 — worst week
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: {
                  week: { $week: { date: "$startedAt", timezone: tz } },
                  year: { $year: { date: "$startedAt", timezone: tz } },
                },
                seconds: { $sum: "$durationSeconds" },
                sessions: { $sum: 1 },
              },
            },
            { $sort: { seconds: 1 } },
            { $limit: 1 },
          ]),
          // 10 — best month
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: {
                  month: { $month: { date: "$startedAt", timezone: tz } },
                  year: { $year: { date: "$startedAt", timezone: tz } },
                },
                seconds: { $sum: "$durationSeconds" },
                sessions: { $sum: 1 },
              },
            },
            { $sort: { seconds: -1 } },
            { $limit: 1 },
          ]),
          // 11 — worst month
          Session.aggregate([
            { $match: { user: userId, isRunning: false } },
            {
              $group: {
                _id: {
                  month: { $month: { date: "$startedAt", timezone: tz } },
                  year: { $year: { date: "$startedAt", timezone: tz } },
                },
                seconds: { $sum: "$durationSeconds" },
                sessions: { $sum: 1 },
              },
            },
            { $sort: { seconds: 1 } },
            { $limit: 1 },
          ]),
        ]
      : [];

    const results = await Promise.all([...baseAggs, ...advancedAggs]);
    const [todayAgg, thisWeekAgg, thisMonthAgg, thisYearAgg, ...rest] = results;

    const todaySec = todayAgg[0]?.seconds ?? 0;
    const thisWeekSec = thisWeekAgg[0]?.seconds ?? 0;
    const thisMonthSec = thisMonthAgg[0]?.seconds ?? 0;
    const thisYearSec = thisYearAgg[0]?.seconds ?? 0;

    let advanced = {};
    if (hasFull) {
      const [allTimeAgg, bestDayAgg, avgSessionAgg, worstDayAgg, bestWeekAgg, worstWeekAgg, bestMonthAgg, worstMonthAgg] = rest;
      const allTimeSec = allTimeAgg[0]?.seconds ?? 0;
      const totalSessions = allTimeAgg[0]?.count ?? 0;
      const avgSec = avgSessionAgg[0]?.avgSeconds ?? 0;
      const bestDay = bestDayAgg[0];
      const worstDay = worstDayAgg[0];
      const bestWeek = bestWeekAgg[0];
      const worstWeek = worstWeekAgg[0];
      const bestMonth = bestMonthAgg[0];
      const worstMonth = worstMonthAgg[0];

      advanced = {
        allTime: {
          seconds: allTimeSec,
          hours: +(allTimeSec / 3600).toFixed(2),
          sessions: totalSessions,
        },
        avgSession: {
          seconds: Math.round(avgSec),
          minutes: Math.round(avgSec / 60),
        },
        bestDay: bestDay
          ? {
              date: `${bestDay._id.y}-${String(bestDay._id.m).padStart(2, "0")}-${String(bestDay._id.d).padStart(2, "0")}`,
              seconds: bestDay.seconds,
              hours: +(bestDay.seconds / 3600).toFixed(2),
              sessions: bestDay.sessions,
            }
          : null,
        worstDay: worstDay
          ? {
              date: `${worstDay._id.y}-${String(worstDay._id.m).padStart(2, "0")}-${String(worstDay._id.d).padStart(2, "0")}`,
              seconds: worstDay.seconds,
              hours: +(worstDay.seconds / 3600).toFixed(2),
              sessions: worstDay.sessions,
            }
          : null,
        bestWeek: bestWeek
          ? {
              year: bestWeek._id.year,
              week: bestWeek._id.week,
              seconds: bestWeek.seconds,
              hours: +(bestWeek.seconds / 3600).toFixed(2),
              sessions: bestWeek.sessions,
            }
          : null,
        worstWeek: worstWeek
          ? {
              year: worstWeek._id.year,
              week: worstWeek._id.week,
              seconds: worstWeek.seconds,
              hours: +(worstWeek.seconds / 3600).toFixed(2),
              sessions: worstWeek.sessions,
            }
          : null,
        bestMonth: bestMonth
          ? {
              year: bestMonth._id.year,
              month: bestMonth._id.month,
              seconds: bestMonth.seconds,
              hours: +(bestMonth.seconds / 3600).toFixed(2),
              sessions: bestMonth.sessions,
            }
          : null,
        worstMonth: worstMonth
          ? {
              year: worstMonth._id.year,
              month: worstMonth._id.month,
              seconds: worstMonth.seconds,
              hours: +(worstMonth.seconds / 3600).toFixed(2),
              sessions: worstMonth.sessions,
            }
          : null,
      };
    }

    const weekGoalSec = req.user.weeklyHourGoal * 3600;
    const weekProgress =
      weekGoalSec > 0 ? (thisWeekSec / weekGoalSec) * 100 : 0;

    res.json({
      today: { seconds: todaySec, hours: +(todaySec / 3600).toFixed(2), sessions: todayAgg[0]?.sessions ?? 0 },
      thisWeek: { seconds: thisWeekSec, hours: +(thisWeekSec / 3600).toFixed(2), sessions: thisWeekAgg[0]?.sessions ?? 0 },
      thisMonth: { seconds: thisMonthSec, hours: +(thisMonthSec / 3600).toFixed(2), sessions: thisMonthAgg[0]?.sessions ?? 0 },
      thisYear: { seconds: thisYearSec, hours: +(thisYearSec / 3600).toFixed(2), sessions: thisYearAgg[0]?.sessions ?? 0 },
      weekGoal: {
        targetHours: req.user.weeklyHourGoal,
        progressPct: +weekProgress.toFixed(1),
      },
      ...advanced,
      meta: { dateRangeLimited: isLimited, maxDays },
    });
  } catch (err) {
    console.error("overview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ------------------------------------------------------------------
// GET /api/analytics/by-tag
// ------------------------------------------------------------------

export async function byTag(req, res) {
  try {
    const { from, to } = req.query;
    const tz = userTz(req);
    const { minDate, isLimited, maxDays } = getPlanAnalyticsMeta(req);
    const filter = { user: req.user._id, isRunning: false };

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (minDate) {
      const reqFrom = dateFilter.$gte ? new Date(dateFilter.$gte) : null;
      if (!reqFrom || reqFrom < minDate) dateFilter.$gte = minDate;
    }
    if (Object.keys(dateFilter).length) filter.startedAt = dateFilter;

    const rows = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$tag",
          seconds: { $sum: "$durationSeconds" },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { seconds: -1 } },
      {
        $lookup: {
          from: "tags",
          localField: "_id",
          foreignField: "_id",
          as: "tag",
        },
      },
      { $unwind: "$tag" },
      {
        $project: {
          tag: { _id: 1, name: 1, color: 1 },
          seconds: 1,
          sessions: 1,
        },
      },
    ]);

    const total = rows.reduce((s, r) => s + r.seconds, 0);
    const data = rows.map((r) => ({
      tag: r.tag,
      seconds: r.seconds,
      hours: +(r.seconds / 3600).toFixed(2),
      sessions: r.sessions,
      pct: total > 0 ? +((r.seconds / total) * 100).toFixed(1) : 0,
    }));

    res.json({ data, totalSeconds: total, totalHours: +(total / 3600).toFixed(2), meta: { dateRangeLimited: isLimited, maxDays } });
  } catch (err) {
    console.error("byTag error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ------------------------------------------------------------------
// GET /api/analytics/heatmap
// ------------------------------------------------------------------

export async function heatmap(req, res) {
  try {
    const days = Math.min(Number(req.query.days ?? 365), 730);
    const tz = userTz(req);
    const { minDate, isLimited, maxDays } = getPlanAnalyticsMeta(req);
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - days);
    from.setUTCHours(0, 0, 0, 0);
    const effectiveFrom = minDate && from < minDate ? minDate : from;

    const rows = await Session.aggregate([
      {
        $match: {
          user: req.user._id,
          isRunning: false,
          startedAt: { $gte: effectiveFrom },
        },
      },
      {
        $group: {
          _id: {
            y: { $year: { date: "$startedAt", timezone: tz } },
            m: { $month: { date: "$startedAt", timezone: tz } },
            d: { $dayOfMonth: { date: "$startedAt", timezone: tz } },
          },
          seconds: { $sum: "$durationSeconds" },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    ]);

    const data = rows.map((r) => ({
      date: `${r._id.y}-${String(r._id.m).padStart(2, "0")}-${String(r._id.d).padStart(2, "0")}`,
      seconds: r.seconds,
      hours: +(r.seconds / 3600).toFixed(2),
      sessions: r.sessions,
    }));

    res.json({ data, meta: { dateRangeLimited: isLimited, maxDays } });
  } catch (err) {
    console.error("heatmap error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ------------------------------------------------------------------
// GET /api/analytics/streaks
// ------------------------------------------------------------------

export async function streaks(req, res) {
  try {
    const userId = req.user._id;
    const tz = userTz(req);
    const { minDate, isLimited, maxDays } = getPlanAnalyticsMeta(req);

    const match = { user: userId, isRunning: false };
    if (minDate) match.startedAt = { $gte: minDate };

    // All distinct session dates in the user's local timezone
    const rows = await Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: { date: "$startedAt", timezone: tz } },
            m: { $month: { date: "$startedAt", timezone: tz } },
            d: { $dayOfMonth: { date: "$startedAt", timezone: tz } },
          },
        },
      },
      { $sort: { "_id.y": -1, "_id.m": -1, "_id.d": -1 } },
    ]);

    if (!rows.length)
      return res.json({ current: 0, longest: 0, todayDone: false, totalActiveDays: 0 });

    const dates = rows.map(
      (r) =>
        `${r._id.y}-${String(r._id.m).padStart(2, "0")}-${String(r._id.d).padStart(2, "0")}`,
    );

    // "Today" in user's timezone
    const nowParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (type) => nowParts.find((p) => p.type === type).value;
    const today = `${get("year")}-${get("month")}-${get("day")}`;

    // "Yesterday" in user's timezone
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yestParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
    }).formatToParts(yesterdayObj);
    const getY = (type) => yestParts.find((p) => p.type === type).value;
    const yesterday = `${getY("year")}-${getY("month")}-${getY("day")}`;

    const todayDone = dates[0] === today;
    const activeStart = todayDone ? today : yesterday;

    let current = 0;
    if (dates.includes(activeStart)) {
      let cursor = new Date(activeStart + "T12:00:00Z"); // noon UTC = safe mid-day reference
      for (const d of dates) {
        const expected = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
        if (d === expected) {
          current++;
          cursor.setUTCDate(cursor.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longest = 1, run = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + "T12:00:00Z");
      const curr = new Date(dates[i] + "T12:00:00Z");
      const diff = (prev - curr) / 86400000;
      if (Math.round(diff) === 1) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 1;
      }
    }

    res.json({ current, longest, todayDone, totalActiveDays: dates.length, meta: { dateRangeLimited: isLimited, maxDays } });
  } catch (err) {
    console.error("streaks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ------------------------------------------------------------------
// GET /api/analytics/weekly
// ------------------------------------------------------------------

export async function weekly(req, res) {
  try {
    const weeks = Math.min(Number(req.query.weeks ?? 12), 52);
    const tz = userTz(req);
    const { minDate, isLimited, maxDays } = getPlanAnalyticsMeta(req);
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - weeks * 7);
    const effectiveFrom = minDate && from < minDate ? minDate : from;

    const rows = await Session.aggregate([
      {
        $match: {
          user: req.user._id,
          isRunning: false,
          startedAt: { $gte: effectiveFrom },
        },
      },
      {
        $group: {
          _id: {
            week: { $week: { date: "$startedAt", timezone: tz } },
            year: { $year: { date: "$startedAt", timezone: tz } },
          },
          seconds: { $sum: "$durationSeconds" },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const data = rows.map((r) => ({
      year: r._id.year,
      week: r._id.week,
      seconds: r.seconds,
      hours: +(r.seconds / 3600).toFixed(2),
      sessions: r.sessions,
    }));

    res.json({ data, meta: { dateRangeLimited: isLimited, maxDays } });
  } catch (err) {
    console.error("weekly error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ------------------------------------------------------------------
// GET /api/analytics/sessions
// ------------------------------------------------------------------
// Query: ?date=YYYY-MM-DD  (returns all sessions whose local date in the
// user's timezone matches the given date).
// Legacy ?from=&to= is still accepted for backward compat but prefer ?date=.

export async function daySessions(req, res) {
  try {
    const { date, from, to } = req.query;
    const tz = userTz(req);
    const { minDate, isLimited, maxDays } = getPlanAnalyticsMeta(req);

    let sessions;

    if (date) {
      // New tz-aware path — match by local date string
      const dateMatch = { user: req.user._id, isRunning: false };
      if (minDate) dateMatch.startedAt = { $gte: minDate };
      sessions = await Session.aggregate([
        { $match: dateMatch },
        {
          $addFields: {
            localDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$startedAt", timezone: tz },
            },
          },
        },
        { $match: { localDate: date } },
        { $sort: { startedAt: 1 } },
        {
          $lookup: {
            from: "tags",
            localField: "tag",
            foreignField: "_id",
            as: "tag",
          },
        },
        { $unwind: { path: "$tag", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            startedAt: 1,
            endedAt: 1,
            durationSeconds: 1,
            label: 1,
            notes: 1,
            isEdited: 1,
            "tag.name": 1,
            "tag.color": 1,
          },
        },
      ]);
    } else if (from && to) {
      // Legacy UTC path
      let fromDate = new Date(from);
      const toDate = new Date(to);
      if (minDate && fromDate < minDate) fromDate = minDate;
      const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;
      if (toDate - fromDate > MAX_RANGE_MS) {
        return res.status(400).json({ error: "Date range cannot exceed 1 year." });
      }
      sessions = await Session.find({
        user: req.user._id,
        isRunning: false,
        startedAt: { $gte: fromDate, $lte: toDate },
      })
        .sort({ startedAt: 1 })
        .populate("tag", "name color")
        .lean();
    } else {
      return res.status(400).json({ error: "Provide ?date=YYYY-MM-DD or both ?from= and ?to=" });
    }

    res.json({ sessions, meta: { dateRangeLimited: isLimited, maxDays } });
  } catch (err) {
    console.error("daySessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
