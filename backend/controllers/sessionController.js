import Session from "#models/Session";
import Tag from "#models/Tag";
import SubTag from "#models/SubTag";
import DefaultTag from "#models/DefaultTag";
import UserDefaultTagPreference from "#models/UserDefaultTagPreference";

const SESSION_MAX_LIMIT = 200;
const SESSION_MAX_DURATION_SECONDS = 86400; // 24 hours

async function resolveTagRefs(userId, tagId, subTagId) {
  if (!tagId) {
    if (subTagId) {
      throw { status: 400, error: "subTagId requires a tagId" };
    }
    return { tag: null, tagModel: null, subTag: null };
  }

  let tag = await Tag.findOne({ _id: tagId, user: userId });
  let tagModel = "Tag";

  if (!tag) {
    tag = await DefaultTag.findOne({ _id: tagId, isActive: true });
    tagModel = "DefaultTag";
    if (!tag) throw { status: 404, error: "Tag not found" };
  }

  let subTag = null;
  if (subTagId) {
    if (tagModel !== "Tag") {
      throw {
        status: 400,
        error: "SubTags cannot be used with platform default tags",
      };
    }
    subTag = await SubTag.findOne({
      _id: subTagId,
      tag: tag._id,
      user: userId,
    });
    if (!subTag) throw { status: 404, error: "SubTag not found" };
  }

  return { tag: tag._id, tagModel, subTag: subTag?._id ?? null };
}

async function populateSession(session) {
  if (session.tagModel === "Tag") {
    await session.populate("tag", "name color");
  } else if (session.tagModel === "DefaultTag") {
    await session.populate({
      path: "tag",
      model: "DefaultTag",
      select: "name color key",
    });
  }
  if (session.subTag) {
    await session.populate("subTag", "name color");
  }
  return session;
}


// GET /api/sessions
// Query params: tagId, subTagId, from (ISO date), to (ISO date), page, limit, search

export async function getSessions(req, res) {
  try {

    const { tagId, subTagId, from, to, page = 1, search } = req.query;

    const limit = Math.min(Number(req.query.limit) || 20, SESSION_MAX_LIMIT);

    const filter = { user: req.user._id };

    if (subTagId) {
      filter.subTag = subTagId;
    } else if (tagId) {
      if (tagId === "none") {
        filter.tag = null;
      } else {
        filter.tag = tagId;
      }
    }

    if (from || to) {
      filter.startedAt = {};
      if (from) filter.startedAt.$gte = new Date(from);
      if (to) filter.startedAt.$lte = new Date(to);
    }

    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ label: re }, { notes: re }, { keywords: re }];
    }

    const total = await Session.countDocuments(filter);
    const sessions = await Session.find(filter)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const populated = await Promise.all(sessions.map(populateSession));

    res.json({
      sessions: populated,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// GET /api/sessions/running

export async function getRunningSession(req, res) {
  try {
    const session = await Session.findOne({
      user: req.user._id,
      isRunning: true,
    });

    if (!session) return res.json({ session: null });

    await populateSession(session);
    res.json({ session });
  } catch (err) {
    console.error("getRunningSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// POST /api/sessions/start
// Body: { tagId?, subTagId?, label? }

export async function startSession(req, res) {
  try {
    const { tagId, subTagId, label } = req.body;

    let tagRefs;
    try {
      tagRefs = await resolveTagRefs(req.user._id, tagId, subTagId);
    } catch (e) {
      return res.status(e.status).json({ error: e.error });
    }

    await Session.updateMany(
      { user: req.user._id, isRunning: true },
      { $set: { isRunning: false, endedAt: new Date() } },
    );

    const session = await Session.create({
      user: req.user._id,
      tag: tagRefs.tag,
      tagModel: tagRefs.tagModel,
      subTag: tagRefs.subTag,
      label,
      startedAt: new Date(),
      isRunning: true,
    });

    await populateSession(session);
    res.status(201).json({ session });
  } catch (err) {
    console.error("startSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// POST /api/sessions/:id/stop
// Body: { notes?, label?, keywords? }

export async function stopSession(req, res) {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
      isRunning: true,
    });
    if (!session)
      return res.status(404).json({ error: "Running session not found" });

    const now = new Date();
    const clientEnd = req.body.endedAt ? new Date(req.body.endedAt) : null;
    const endedAt =
      clientEnd && clientEnd <= now && clientEnd > session.startedAt
        ? clientEnd
        : now;

    const rawDuration =
      typeof req.body.durationSeconds === "number" &&
      req.body.durationSeconds > 0
        ? Math.round(req.body.durationSeconds)
        : Math.round((endedAt - session.startedAt) / 1000);

    const duration = Math.min(rawDuration, SESSION_MAX_DURATION_SECONDS);

    session.endedAt = endedAt;
    session.isRunning = false;
    session.durationSeconds = duration;
    if (req.body.notes !== undefined) session.notes = req.body.notes;
    if (req.body.label !== undefined) session.label = req.body.label;
    if (req.body.keywords !== undefined) session.keywords = req.body.keywords;

    await session.save();
    await populateSession(session);
    res.json({ session });
  } catch (err) {
    console.error("stopSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
//  POST /api/sessions/delete-all
//  Hard-deletes every session, tag, subtag, and default-tag preference
//  belonging to the authenticated user. This is irreversible.
export async function deleteAllUserData(req, res) {
  try {
    const userId = req.user._id;

    const [sessionsDeleted, tagsDeleted, subTagsDeleted, prefsDeleted] =
      await Promise.all([
        Session.deleteMany({ user: userId }),
        Tag.deleteMany({ user: userId }),
        SubTag.deleteMany({ user: userId }),
        UserDefaultTagPreference.deleteMany({ user: userId }),
      ]);

    res.json({
      message: "All data deleted successfully",
      sessions: sessionsDeleted.deletedCount ?? 0,
      tags: tagsDeleted.deletedCount ?? 0,
      subTags: subTagsDeleted.deletedCount ?? 0,
      preferences: prefsDeleted.deletedCount ?? 0,
    });
  } catch (err) {
    console.error("deleteAllUserData error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
