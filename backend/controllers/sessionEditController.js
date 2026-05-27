import Session from "#models/Session";
import Tag from "#models/Tag";
import SubTag from "#models/SubTag";
import DefaultTag from "#models/DefaultTag";

const SESSION_MAX_DURATION_SECONDS = 86400; // 24 hours

//  Helpers (duplicated from sessionController to keep files independent)
async function resolveTagRefs(userId, tagId, subTagId) {
  if (!tagId) {
    if (subTagId) throw { status: 400, error: "subTagId requires a tagId" };
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

/**
 * DELETE /api/sessions/:id
 * Hard-deletes the session from the database. Only the owning user can delete
 * their own sessions (enforced by the user filter on the query).
 */
export async function deleteSession(req, res) {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ message: "Session deleted" });
  } catch (err) {
    console.error("deleteSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/sessions (manual log)
 * Manually logged sessions are ALWAYS excluded from the leaderboard.
 * isEdited is set to true unconditionally
 * Body: { tagId?, subTagId?, label?, notes?, keywords?, startedAt, endedAt }
 */
export async function createSession(req, res) {
  try {
    const { tagId, subTagId, label, notes, startedAt, endedAt, keywords } =
      req.body;

    if (!startedAt || !endedAt) {
      return res
        .status(400)
        .json({ error: "startedAt and endedAt are required" });
    }

    let tagRefs;
    try {
      tagRefs = await resolveTagRefs(req.user._id, tagId, subTagId);
    } catch (e) {
      return res.status(e.status).json({ error: e.error });
    }

    const start = new Date(startedAt);
    const end = new Date(endedAt);

    if (isNaN(start))
      return res.status(400).json({ error: "Invalid startedAt" });
    if (isNaN(end)) return res.status(400).json({ error: "Invalid endedAt" });

    const rawDuration = Math.round((end - start) / 1000);
    if (rawDuration <= 0)
      return res.status(400).json({ error: "endedAt must be after startedAt" });

    // Cap at 24 hours — prevents inflated stats from manual entries
    const duration = Math.min(rawDuration, SESSION_MAX_DURATION_SECONDS);

    const session = await Session.create({
      user: req.user._id,
      tag: tagRefs.tag,
      tagModel: tagRefs.tagModel,
      subTag: tagRefs.subTag,
      label,
      notes,
      keywords,
      startedAt: start,
      endedAt: end,
      durationSeconds: duration,
      isRunning: false,
      // Always excluded from leaderboard — enforced server-side, never from client input.
      isEdited: true,
    });

    await populateSession(session);
    res.status(201).json({ session });
  } catch (err) {
    console.error("createSession error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /api/sessions/:id
 * Accepts the same body as sessionController.updateSession PLUS:
 *   - startedAt    (ISO string) — recalculates durationSeconds automatically
 *   - endedAt      (ISO string)
 *   - durationSeconds — caller may pass a pre-computed value
 *   - isEdited     (boolean) — when true, flags the session so it is excluded
 *
 * tagId === null   → untag (also clears subTag)
 * tagId === "..."  → switch tag
 * tagId undefined  → leave tag unchanged unless subTagId is also provided
 */
export async function editSession(req, res) {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const {
      label,
      notes,
      keywords,
      tagId,
      subTagId,
      startedAt,
      endedAt,
      durationSeconds,
      isEdited,
    } = req.body;

    // Scalar fields
    if (label !== undefined) session.label = label;
    if (notes !== undefined) session.notes = notes;
    if (keywords !== undefined) session.keywords = keywords;

    // Time fields
    let newStart = startedAt ? new Date(startedAt) : null;
    let newEnd = endedAt ? new Date(endedAt) : null;

    if (newStart && isNaN(newStart))
      return res.status(400).json({ error: "Invalid startedAt" });
    if (newEnd && isNaN(newEnd))
      return res.status(400).json({ error: "Invalid endedAt" });

    if (newStart) session.startedAt = newStart;
    if (newEnd) session.endedAt = newEnd;

    // Re-compute duration when either endpoint changes.
    // Prefer caller-supplied durationSeconds (already excludes pause time),
    // otherwise derive from the (possibly updated) timestamps.
    if (newStart || newEnd) {
      const start = newStart ?? session.startedAt;
      const end = newEnd ?? session.endedAt;

      if (end && start && end <= start) {
        return res
          .status(400)
          .json({ error: "endedAt must be after startedAt" });
      }

      if (typeof durationSeconds === "number" && durationSeconds > 0) {
        session.durationSeconds = Math.round(durationSeconds);
      } else if (end && start) {
        session.durationSeconds = Math.round((end - start) / 1000);
      }
    } else if (typeof durationSeconds === "number" && durationSeconds > 0) {
      // Duration-only override (unusual but supported).
      session.durationSeconds = Math.round(durationSeconds);
    }

    // Leaderboard exclusion flag
    // Once flagged, the session stays excluded even if re-edited later.
    if (isEdited === true) {
      session.isEdited = true;
    }

    // Tag / subTag
    if (tagId !== undefined || subTagId !== undefined) {
      if (tagId === null || tagId === "") {
        session.tag = null;
        session.tagModel = null;
        session.subTag = null;
      } else {
        const resolvedTagId =
          tagId !== undefined ? tagId : session.tag?.toString();
        let tagRefs;
        try {
          tagRefs = await resolveTagRefs(
            req.user._id,
            resolvedTagId,
            subTagId !== undefined ? subTagId : null,
          );
        } catch (e) {
          return res.status(e.status).json({ error: e.error });
        }
        session.tag = tagRefs.tag;
        session.tagModel = tagRefs.tagModel;
        session.subTag = tagRefs.subTag;
      }
    }

    await session.save();
    await populateSession(session);
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
