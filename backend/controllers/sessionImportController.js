import Session from "#models/Session";
import Tag from "#models/Tag";

const IMPORT_MAX_ROWS = 10_000;
const IMPORT_CHUNK_SIZE = 500;
const SESSION_MAX_DURATION_SECONDS = 86_400; // 24 h

/**
 * POST /api/sessions/import/:userId
 *
 * Bulk-imports historical sessions for the authenticated user.
 * The :userId param must match req.user._id (JWT is always the source of truth).
 *
 * Body: { sessions: Array<ImportRow> }
 *
 * ImportRow (all fields except startedAt / endedAt are optional):
 *   startedAt        ISO date string  — required
 *   endedAt          ISO date string  — required
 *   tag              string           — tag name; created on-the-fly if absent (preferred)
 *   category         string           — alias for tag; used as fallback if tag is absent
 *   label            string
 *   notes            string
 *   keywords         string[]
 *   durationSeconds  number           — auto-computed from timestamps if omitted
 *
 * Note: isRunning and isEdited are ALWAYS set server-side (false / true).
 * Any client-supplied values for these fields are ignored.
 *
 * Response 207 Multi-Status:
 *   { imported: number, skipped: number, errors: Array<{ row, reason }> }
 */
export async function importSessions(req, res) {
  //  Step 0 · Verify :userId matches the authenticated user
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "userId param is required" });
  }
  if (userId !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ error: "You can only import sessions for your own account" });
  }

  //  Step 1 · Validate payload shape
  const { sessions: rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res
      .status(400)
      .json({ error: "sessions must be a non-empty array" });
  }
  if (rows.length > IMPORT_MAX_ROWS) {
    return res.status(400).json({
      error: `Too many rows. Max ${IMPORT_MAX_ROWS} per request, got ${rows.length}.`,
    });
  }

  const ownerId = req.user._id;

  //  Step 2 · Resolve / force-create tags by name
  // Accept row.tag (preferred) or row.category (legacy alias).
  // originalNameByKey preserves the original casing for DB writes;
  // tagByKey is keyed lowercase so lookups are case-insensitive.
  const resolveTagName = (r) => {
    const name = r.tag ?? r.category;
    return typeof name === "string" ? name.trim() : null;
  };

  // Collect unique tag names, preserving original casing for the first
  // occurrence of each lowercase key (used when creating new tags).
  const originalNameByKey = new Map(); // lowercase key → original-cased name
  for (const row of rows) {
    const name = resolveTagName(row);
    if (name) {
      const key = name.toLowerCase();
      if (!originalNameByKey.has(key)) originalNameByKey.set(key, name);
    }
  }

  const categoryNames = [...originalNameByKey.values()]; // original-cased names for DB query

  // Load existing tags — case-insensitive match via $regex so "resonance"
  // matches a stored tag named "Resonance".
  const existingTags = await Tag.find({
    user: ownerId,
    name: {
      $in: categoryNames.map(
        (n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ),
    },
  }).select("_id name");

  // Key by lowercase so all subsequent lookups are case-insensitive.
  const tagByKey = new Map(
    existingTags.map((t) => [t.name.toLowerCase(), t._id]),
  );

  // Force-create any tags that don't exist yet (bypass plan limits).
  // Use findOneAndUpdate with upsert so concurrent imports don't race.
  for (const [key, originalName] of originalNameByKey) {
    if (tagByKey.has(key)) continue;

    const tag = await Tag.findOneAndUpdate(
      { user: ownerId, name: originalName },
      {
        $setOnInsert: {
          user: ownerId,
          name: originalName,
          color: "#93c5fd", // default blue, same as Tag schema default
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

    // Required timestamps
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

    // Skip 0-second sessions (endedAt === startedAt)
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

    // Resolve tag — look up by lowercase key so matching is case-insensitive.
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
      subTag: null, // import does not support subtags
      startedAt: start,
      endedAt: end,
      durationSeconds: duration,
      label: row.label ?? undefined,
      notes: row.notes ?? undefined,
      keywords: Array.isArray(row.keywords) ? row.keywords : undefined,
      // Always enforced server-side — client values are intentionally ignored.
      isRunning: false,
      isEdited: true,
    });
  }

  //  Step 4 · Chunked insertMany
  let imported = 0;

  for (let offset = 0; offset < docs.length; offset += IMPORT_CHUNK_SIZE) {
    const chunk = docs.slice(offset, offset + IMPORT_CHUNK_SIZE);
    try {
      const result = await Session.insertMany(chunk, {
        ordered: false, // don't abort the chunk on a single bad doc
        rawResult: true,
      });
      imported += result.insertedCount ?? chunk.length;
    } catch (err) {
      // insertMany with ordered:false throws a BulkWriteError but still
      // inserts the valid documents. Extract the count from the result.
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
        // Unexpected error — bail out with what we have.
        console.error("importSessions chunk error:", err);
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
    // Cap error list at 100 entries to keep the response readable.
    errors: errors.slice(0, 100),
  });
}
