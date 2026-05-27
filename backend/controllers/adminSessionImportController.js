import Session from "#models/Session";
import Tag from "#models/Tag";
import User from "#models/User";

const ADMIN_IMPORT_MAX_ROWS = 50_000;
const IMPORT_CHUNK_SIZE = 1000;
const SESSION_MAX_DURATION_SECONDS = 86_400; // 24 h

/**
 * POST /api/admin/sessions/import/:userId
 *
 * Admin-only bulk import of sessions for ANY user.
 * Requires: protect + requireAdmin middleware on the route.
 *
 * :userId  — the target user's _id (MongoDB ObjectId string)
 *
 * Body: { sessions: Array<ImportRow> }
 *
 * ImportRow:
 *   startedAt        ISO date string  — required
 *   endedAt          ISO date string  — required
 *   category         string           — tag name; created on-the-fly if absent
 *   label            string
 *   notes            string
 *   keywords         string[]
 *   durationSeconds  number           — auto-computed from timestamps if omitted
 *   isEdited         boolean          — defaults to true
 *
 * Response 207 Multi-Status:
 *   { imported, skipped, errors: [{ row, reason }] }
 */
export async function adminImportSessions(req, res) {
  //  Step 0 · Verify target user exists
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "userId param is required" });
  }

  const targetUser = await User.findById(userId).select("_id email").lean();
  if (!targetUser) {
    return res.status(404).json({ error: "Target user not found" });
  }

  //  Step 1 · Validate payload shape
  const { sessions: rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res
      .status(400)
      .json({ error: "sessions must be a non-empty array" });
  }
  if (rows.length > ADMIN_IMPORT_MAX_ROWS) {
    return res.status(400).json({
      error: `Too many rows. Max ${ADMIN_IMPORT_MAX_ROWS} per request, got ${rows.length}.`,
    });
  }

  const ownerId = targetUser._id;

  const resolveTagName = (r) => {
    const name = r.tag ?? r.category;
    return typeof name === "string" ? name.trim() : null;
  };

  // Collect unique names, keyed lowercase → preserves original casing for DB writes
  const originalNameByKey = new Map();
  for (const row of rows) {
    const name = resolveTagName(row);
    if (name) {
      const key = name.toLowerCase();
      if (!originalNameByKey.has(key)) originalNameByKey.set(key, name);
    }
  }

  const categoryNames = [...originalNameByKey.values()];

  // Case-insensitive match so "school" hits an existing "School" tag
  const existingTags = await Tag.find({
    user: ownerId,
    name: {
      $in: categoryNames.map(
        (n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ),
    },
  }).select("_id name");

  // Key by lowercase for case-insensitive lookups throughout
  const tagByKey = new Map(
    existingTags.map((t) => [t.name.toLowerCase(), t._id]),
  );

  for (const [key, originalName] of originalNameByKey) {
    if (tagByKey.has(key)) continue;

    const tag = await Tag.findOneAndUpdate(
      { user: ownerId, name: originalName },
      {
        $setOnInsert: {
          user: ownerId,
          name: originalName,
          color: "#93c5fd",
          status: "active",
          isHidden: false,
          order: 0,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    tagByKey.set(key, tag._id);
  }

  //  Step 3 · Validate and build documents
  const docs = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const start = row.startedAt ? new Date(row.startedAt) : null;
    const end = row.endedAt ? new Date(row.endedAt) : null;

    if (!start || isNaN(start.getTime())) {
      errors.push({ row: i, reason: "Invalid or missing startedAt" });
      continue;
    }
    if (!end || isNaN(end.getTime())) {
      errors.push({ row: i, reason: "Invalid or missing endedAt" });
      continue;
    }

    const rawDuration = Math.round((end - start) / 1000);

    if (rawDuration <= 0) {
      errors.push({
        row: i,
        reason: "Skipped: endedAt must be after startedAt",
      });
      continue;
    }

    const duration =
      typeof row.durationSeconds === "number" && row.durationSeconds > 0
        ? Math.min(
            Math.round(row.durationSeconds),
            SESSION_MAX_DURATION_SECONDS,
          )
        : Math.min(rawDuration, SESSION_MAX_DURATION_SECONDS);

    let tag = null;
    let tagModel = null;

    const tagName = resolveTagName(row);
    if (tagName) {
      tag = tagByKey.get(tagName.toLowerCase()) ?? null;
      if (tag) tagModel = "Tag";
    }

    docs.push({
      user: ownerId,
      tag,
      tagModel,
      subTag: null,
      startedAt: start,
      endedAt: end,
      durationSeconds: duration,
      label: row.label ?? undefined,
      notes: row.notes ?? undefined,
      keywords: Array.isArray(row.keywords) ? row.keywords : undefined,
      isRunning: false,
      isEdited: row.isEdited === false ? false : true,
    });
  }

  //  Step 4 · Chunked insertMany
  let imported = 0;

  for (let offset = 0; offset < docs.length; offset += IMPORT_CHUNK_SIZE) {
    const chunk = docs.slice(offset, offset + IMPORT_CHUNK_SIZE);
    try {
      const result = await Session.insertMany(chunk, {
        ordered: false,
        rawResult: true,
      });
      imported += result.insertedCount ?? chunk.length;
    } catch (err) {
      if (err.result) {
        imported += err.result.nInserted ?? 0;
        const writeErrors = err.result.getWriteErrors?.() ?? [];
        for (const we of writeErrors) {
          errors.push({
            row: offset + we.index,
            reason: we.errmsg ?? "Write error",
          });
        }
      } else {
        console.error("adminImportSessions chunk error:", err);
        return res.status(207).json({
          imported,
          skipped: rows.length - imported,
          errors: [
            ...errors.slice(0, 100),
            { row: offset, reason: "Chunk write failed: " + err.message },
          ],
        });
      }
    }
  }

  const skipped = rows.length - imported - errors.length;

  return res.status(207).json({
    imported,
    skipped: Math.max(skipped, 0),
    errors: errors.slice(0, 100),
  });
}
