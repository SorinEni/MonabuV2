import mongoose from "mongoose";
import Tag from "#models/Tag";
import SubTag from "#models/SubTag";
import DefaultTag from "#models/DefaultTag";
import UserDefaultTagPreference from "#models/UserDefaultTagPreference";
import Session from "#models/Session";
import { TRANSLATIONS } from "#constants/translations";
import { getPlanConfigSync } from "#utils/plans";

// Normalise to base language code
function userLang(user) {
  return (user?.language || "en").split("-")[0].toLowerCase();
}

/**
 * Resolve a translated display name for a DefaultTag.
 * Falls back: user lang → "en" entry → DB name stored in English.
 */
function translate(key, lang, fallback) {
  const map = TRANSLATIONS[key];
  if (!map) return fallback;
  return map[lang] ?? map.en ?? fallback;
}


// ADMIN / DEVELOPER — platform default tags
// Router-level middleware must enforce:
//   listDefaultTags / getDefaultTags → requireAdmin || requireDeveloper
//   all write routes                 → requireDeveloper only


// /api/admin/default-tags
// List every platform default tag (including inactive ones).

export async function listDefaultTags(req, res) {
  try {
    const tags = await DefaultTag.find().sort({ order: 1, createdAt: 1 });
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/admin/default-tags
 * Create a new platform default tag.
 * Body: { key, name, color?, order? }
 */
export async function createDefaultTag(req, res) {
  try {
    const { key, name, color, order } = req.body;
    if (!key || !name)
      return res.status(400).json({ error: "key and name are required" });

    const tag = await DefaultTag.create({ key, name, color, order });
    res.status(201).json({ tag });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "A default tag with this key already exists" });
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/default-tags/:id
 * Update a platform default tag.
 * Body: { key?, name?, color?, order?, isActive? }
 */
export async function updateDefaultTag(req, res) {
  try {
    const tag = await DefaultTag.findById(req.params.id);
    if (!tag) return res.status(404).json({ error: "Default tag not found" });

    const { key, name, color, order, isActive } = req.body;
    if (key !== undefined) tag.key = key;
    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;
    if (order !== undefined) tag.order = order;
    if (isActive !== undefined) tag.isActive = isActive;

    await tag.save();
    res.json({ tag });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "A default tag with this key already exists" });
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/default-tags/:id
 * Permanently delete a platform default tag.
 * Does NOT cascade to sessions — sessions keep their historical reference.
 */
export async function deleteDefaultTag(req, res) {
  try {
    const tag = await DefaultTag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ error: "Default tag not found" });

    // Clean up any user preferences for this default tag.
    await UserDefaultTagPreference.deleteMany({ defaultTag: req.params.id });

    res.json({ message: "Default tag deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/default-tags/reorder
 * Bulk-update the order of platform default tags.
 * Body: { items: [{ id, order }, ...] }
 */
export async function reorderDefaultTags(req, res) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items))
      return res.status(400).json({ error: "items must be an array" });

    const ops = items.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    }));
    await DefaultTag.bulkWrite(ops);
    res.json({ message: "Default tags reordered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// USER — default tag visibility preference
/**
 * GET /api/tags/defaults
 * Returns all active platform default tags with the current user's
 * hidden preference resolved on each item.
 */
export async function getDefaultTags(req, res) {
  try {
    const [defaults, prefs] = await Promise.all([
      DefaultTag.find({ isActive: true }).sort({ order: 1, createdAt: 1 }),
      UserDefaultTagPreference.find({
        user: req.user._id,
        isHidden: true,
      }).select("defaultTag"),
    ]);

    const hiddenSet = new Set(prefs.map((p) => p.defaultTag.toString()));
    const lang = userLang(req.user);

    const tags = defaults.map((t) => ({
      _id: t._id,
      key: t.key,
      name: translate(t.key, lang, t.name),
      color: t.color,
      order: t.order,
      isHidden: hiddenSet.has(t._id.toString()),
    }));

    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/tags/defaults/:id/preference
 * Toggle the current user's hidden preference for a default tag.
 * Body: { isHidden: boolean }
 */
export async function updateDefaultTagPreference(req, res) {
  try {
    const { isHidden } = req.body;
    if (typeof isHidden !== "boolean")
      return res.status(400).json({ error: "isHidden must be a boolean" });

    const tag = await DefaultTag.findOne({
      _id: req.params.id,
      isActive: true,
    });
    if (!tag) return res.status(404).json({ error: "Default tag not found" });

    await UserDefaultTagPreference.findOneAndUpdate(
      { user: req.user._id, defaultTag: req.params.id },
      { $set: { isHidden } },
      { upsert: true, new: true },
    );

    res.json({ message: "Preference updated", isHidden });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// USER — personal tags
/**
 * GET /api/tags
 * Returns the user's tags (with their subtags nested), plus active default
 * tags (filtered by the user's hidden preferences), plus an "Untagged" sentinel.

 * Query params:
 *   ?includeArchived=true  — also include archived user tags
 *   ?includeHidden=true    — also include hidden user tags and hidden defaults
 */
export async function getTags(req, res) {
  try {
    const userId = req.user._id;
    const includeArchived = req.query.includeArchived === "true";
    const includeHidden = req.query.includeHidden === "true";

    //  User tags
    const tagFilter = { user: userId };
    if (!includeArchived) tagFilter.status = "active";
    if (!includeHidden) tagFilter.isHidden = false;

    const [userTags, allSubTags] = await Promise.all([
      Tag.find(tagFilter).sort({ order: 1, createdAt: 1 }),
      SubTag.find({ user: userId }).sort({ order: 1, createdAt: 1 }),
    ]);

    // Group subtags by parent tag id.
    const subTagMap = {};
    for (const st of allSubTags) {
      const key = st.tag.toString();
      if (!subTagMap[key]) subTagMap[key] = [];
      subTagMap[key].push(st);
    }

    //  Session stats — one aggregation covers both user tags and default tags.
    //  For user Tags (tagModel "Tag"):   group by tag field directly.
    //  For DefaultTags (tagModel "DefaultTag"): group by tag field directly.
    //  Both land in the same `tag` field on Session, so a single $group works.
    //  We exclude running sessions (no durationSeconds yet).
    const statsAgg = await Session.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isRunning: false,
          tag: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$tag",
          sessionCount: { $sum: 1 },
          totalSeconds: { $sum: "$durationSeconds" },
        },
      },
    ]);

    // Also get untagged stats (tag: null).
    const untaggedAgg = await Session.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isRunning: false,
          tag: null,
        },
      },
      {
        $group: {
          _id: null,
          sessionCount: { $sum: 1 },
          totalSeconds: { $sum: "$durationSeconds" },
        },
      },
    ]);

    // Build a lookup map: tagId (string) → { sessionCount, totalSeconds }
    const statsMap = {};
    for (const row of statsAgg) {
      statsMap[row._id.toString()] = {
        sessionCount: row.sessionCount,
        totalSeconds: row.totalSeconds,
      };
    }

    const userTagsWithSubs = userTags.map((t) => {
      const stats = statsMap[t._id.toString()] ?? {
        sessionCount: 0,
        totalSeconds: 0,
      };
      return {
        ...t.toObject(),
        subTags: subTagMap[t._id.toString()] ?? [],
        sessionCount: stats.sessionCount,
        totalSeconds: stats.totalSeconds,
      };
    });

    //  Default tags
    const [defaults, hiddenPrefs] = await Promise.all([
      DefaultTag.find({ isActive: true }).sort({ order: 1, createdAt: 1 }),
      UserDefaultTagPreference.find({
        user: userId,
        isHidden: true,
      }).select("defaultTag"),
    ]);

    const hiddenDefaultIds = new Set(
      hiddenPrefs.map((p) => p.defaultTag.toString()),
    );

    const lang = userLang(req.user);
    const defaultTags = defaults
      .filter((t) => includeHidden || !hiddenDefaultIds.has(t._id.toString()))
      .map((t) => {
        const stats = statsMap[t._id.toString()] ?? {
          sessionCount: 0,
          totalSeconds: 0,
        };
        return {
          _id: t._id,
          key: t.key,
          name: translate(t.key, lang, t.name),
          color: t.color,
          order: t.order,
          isDefault: true,
          isHidden: hiddenDefaultIds.has(t._id.toString()),
          subTags: [],
          sessionCount: stats.sessionCount,
          totalSeconds: stats.totalSeconds,
        };
      });

    //  Untagged sentinel — attach its own stats
    const untaggedStats = untaggedAgg[0] ?? {
      sessionCount: 0,
      totalSeconds: 0,
    };
    const untagged = {
      _id: null,
      name: translate("untagged", lang, "Untagged"),
      color: "#6b7280",
      status: "active",
      isHidden: false,
      order: -1,
      isDefault: false,
      subTags: [],
      sessionCount: untaggedStats.sessionCount,
      totalSeconds: untaggedStats.totalSeconds,
    };

    res.json({
      tags: [untagged, ...defaultTags, ...userTagsWithSubs],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/tags
 * Create a new personal tag.
 *
 * Plan limits (free): max 5 active tags.
 * Body: { name, color?, order? }
 */
export async function createTag(req, res) {
  try {
    const userId = req.user._id;
    const planConfig = getPlanConfigSync(req.user.plan);
    const activeLimit = planConfig?.activeTagLimit ?? 999;

    if (activeLimit < 900) {
      const activeCount = await Tag.countDocuments({
        user: userId,
        status: "active",
      });
      if (activeCount >= activeLimit) {
        return res.status(403).json({
          error: `Your plan allows up to ${activeLimit} active tags. Upgrade for more.`,
          code: "TAG_LIMIT_REACHED",
        });
      }
    }

    const { name, color, order } = req.body;
    if (!name) return res.status(400).json({ error: "Tag name is required" });

    const tag = await Tag.create({
      user: userId,
      name,
      color,
      order,
      status: "active",
    });
    res.status(201).json({ tag: { ...tag.toObject(), subTags: [] } });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "You already have a tag with this name" });
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/tags/:id
 * Update a user tag's name, color, order, status, or isHidden.
 * Body: { name?, color?, order?, status?, isHidden? }
 */
export async function updateTag(req, res) {
  try {
    const userId = req.user._id;
    const tag = await Tag.findOne({ _id: req.params.id, user: userId });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const { name, color, order, status, isHidden } = req.body;
    const planConfig = getPlanConfigSync(req.user.plan);
    const activeLimit = planConfig?.activeTagLimit ?? 999;
    const archivedLimit = planConfig?.archivedTagLimit ?? 999;

    //  Status transition checks
    if (status !== undefined && status !== tag.status) {
      if (status === "archived" && archivedLimit < 900) {
        const archivedCount = await Tag.countDocuments({
          user: userId,
          status: "archived",
        });
        if (archivedCount >= archivedLimit) {
          return res.status(403).json({
            error: `Your plan allows up to ${archivedLimit} archived tags. Upgrade for more.`,
            code: "ARCHIVE_LIMIT_REACHED",
          });
        }
      } else if (status === "active" && activeLimit < 900) {
        const activeCount = await Tag.countDocuments({
          user: userId,
          status: "active",
        });
        if (activeCount >= activeLimit) {
          return res.status(403).json({
            error: `Your plan allows up to ${activeLimit} active tags. Upgrade for more.`,
            code: "TAG_LIMIT_REACHED",
          });
        }
      }
      tag.status = status;
    }

    if (name !== undefined) tag.name = name;
    if (color !== undefined) tag.color = color;
    if (order !== undefined) tag.order = order;
    if (isHidden !== undefined) tag.isHidden = isHidden;

    await tag.save();
    res.json({ tag });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "You already have a tag with this name" });
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/tags/:id
 * Permanently delete a personal tag.
 * Cascades:
 *   1. All SubTags belonging to this tag are deleted.
 *   2. All Sessions referencing this tag OR any of its subtags are deleted.
 */
export async function deleteTag(req, res) {
  try {
    const userId = req.user._id;
    const tag = await Tag.findOne({ _id: req.params.id, user: userId });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    // Collect subtag ids before deletion.
    const subTagIds = await SubTag.find({ tag: tag._id }).distinct("_id");

    // Delete sessions attached to the tag or any of its subtags.
    await Session.deleteMany({
      user: userId,
      $or: [
        { tag: tag._id },
        ...(subTagIds.length ? [{ subTag: { $in: subTagIds } }] : []),
      ],
    });

    // Delete subtags.
    await SubTag.deleteMany({ tag: tag._id });

    // Delete the tag itself.
    await tag.deleteOne();

    res.json({
      message:
        "Tag, its subtags, and all associated sessions have been deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/tags/reorder
 * Bulk-update the order of the user's tags.
 * Body: { items: [{ id, order }, ...] }
 */
export async function reorderTags(req, res) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items))
      return res.status(400).json({ error: "items must be an array" });

    const ops = items.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, user: req.user._id },
        update: { $set: { order } },
      },
    }));
    await Tag.bulkWrite(ops);
    res.json({ message: "Tags reordered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//
// USER — subtags
//

/**
 * GET /api/tags/:tagId/subtags
 * List all subtags for a given user tag.
 * Query params:
 *   ?includeArchived=true
 *   ?includeHidden=true
 */
export async function getSubTags(req, res) {
  try {
    const tag = await Tag.findOne({
      _id: req.params.tagId,
      user: req.user._id,
    });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const filter = { tag: tag._id };
    if (req.query.includeArchived !== "true") filter.status = "active";
    if (req.query.includeHidden !== "true") filter.isHidden = false;

    const subTags = await SubTag.find(filter).sort({ order: 1, createdAt: 1 });

    // Aggregate session stats per subtag in a single query.
    const subTagIds = subTags.map((st) => st._id);
    const statsAgg = await Session.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          isRunning: false,
          subTag: { $in: subTagIds },
        },
      },
      {
        $group: {
          _id: "$subTag",
          sessionCount: { $sum: 1 },
          totalSeconds: { $sum: "$durationSeconds" },
        },
      },
    ]);

    const statsMap = {};
    for (const row of statsAgg) {
      statsMap[row._id.toString()] = {
        sessionCount: row.sessionCount,
        totalSeconds: row.totalSeconds,
      };
    }

    // Resolve effective color (parent color when subTag.color is null).
    const resolved = subTags.map((st) => {
      const stats = statsMap[st._id.toString()] ?? {
        sessionCount: 0,
        totalSeconds: 0,
      };
      return {
        ...st.toObject(),
        effectiveColor: st.color ?? tag.color,
        sessionCount: stats.sessionCount,
        totalSeconds: stats.totalSeconds,
      };
    });

    res.json({ subTags: resolved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/tags/:tagId/subtags
 * Create a new subtag under a user tag.
 * Body: { name, color?, order? }
 */
export async function createSubTag(req, res) {
  try {
    const tag = await Tag.findOne({
      _id: req.params.tagId,
      user: req.user._id,
    });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    const planConfig = getPlanConfigSync(req.user.plan);
    const subtagLimit = planConfig?.subtagLimit ?? 999;
    if (subtagLimit < 900) {
      const subtagCount = await SubTag.countDocuments({ tag: tag._id });
      if (subtagCount >= subtagLimit) {
        return res.status(403).json({
          error: `Your plan allows up to ${subtagLimit} subtags per tag. Upgrade for more.`,
          code: "SUBTAG_LIMIT_REACHED",
        });
      }
    }
    const { name, color, order } = req.body;
    if (!name)
      return res.status(400).json({ error: "SubTag name is required" });

    const subTag = await SubTag.create({
      user: req.user._id,
      tag: tag._id,
      name,
      color: color ?? null,
      order,
    });

    res.status(201).json({
      subTag: {
        ...subTag.toObject(),
        effectiveColor: subTag.color ?? tag.color,
      },
    });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "This tag already has a subtag with this name" });
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/tags/:tagId/subtags/:id
 * Update a subtag's name, color, order, status, or isHidden.
 * Body: { name?, color?, order?, status?, isHidden? }
 */
export async function updateSubTag(req, res) {
  try {
    const tag = await Tag.findOne({
      _id: req.params.tagId,
      user: req.user._id,
    });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const subTag = await SubTag.findOne({
      _id: req.params.id,
      tag: tag._id,
      user: req.user._id,
    });
    if (!subTag) return res.status(404).json({ error: "SubTag not found" });

    const { name, color, order, status, isHidden } = req.body;
    if (name !== undefined) subTag.name = name;
    // color: null is a valid value (revert to inheriting from parent)
    if (color !== undefined) subTag.color = color === "" ? null : color;
    if (order !== undefined) subTag.order = order;
    if (status !== undefined) subTag.status = status;
    if (isHidden !== undefined) subTag.isHidden = isHidden;

    await subTag.save();

    res.json({
      subTag: {
        ...subTag.toObject(),
        effectiveColor: subTag.color ?? tag.color,
      },
    });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(409)
        .json({ error: "This tag already has a subtag with this name" });
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/tags/:tagId/subtags/:id
 * Delete a subtag.
 * Sessions that referenced this subtag keep their parent tag reference
 * but have their subTag field set to null.
 */
export async function deleteSubTag(req, res) {
  try {
    const tag = await Tag.findOne({
      _id: req.params.tagId,
      user: req.user._id,
    });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const subTag = await SubTag.findOneAndDelete({
      _id: req.params.id,
      tag: tag._id,
      user: req.user._id,
    });
    if (!subTag) return res.status(404).json({ error: "SubTag not found" });

    // Null out the subTag reference on all sessions that used it.
    await Session.updateMany(
      { user: req.user._id, subTag: subTag._id },
      { $set: { subTag: null } },
    );

    res.json({
      message:
        "SubTag deleted. Sessions have been preserved with their parent tag.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/tags/:tagId/subtags/reorder
 * Bulk-update the order of subtags within a tag.
 * Body: { items: [{ id, order }, ...] }
 */
export async function reorderSubTags(req, res) {
  try {
    const tag = await Tag.findOne({
      _id: req.params.tagId,
      user: req.user._id,
    });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const { items } = req.body;
    if (!Array.isArray(items))
      return res.status(400).json({ error: "items must be an array" });

    const ops = items.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, tag: tag._id, user: req.user._id },
        update: { $set: { order } },
      },
    }));
    await SubTag.bulkWrite(ops);
    res.json({ message: "SubTags reordered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
