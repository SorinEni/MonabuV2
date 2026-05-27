import mongoose from "mongoose";

/**
 * Session — a single tracked time block.
 *
 * Tag references:
 *   tag    → ObjectId ref to Tag (user's personal tag) OR DefaultTag.
 *            null means "Untagged".
 *   subTag → ObjectId ref to SubTag, always a child of `tag`.
 *            Only valid when tag is a user Tag (not a DefaultTag).
 *            null means no subtag granularity for this session.
 *
 * Statistics roll-up:
 *   When subTag is set, analytics count the session duration toward BOTH
 *   the subTag AND its parent tag. This is handled in analyticsController,
 *   not stored redundantly here.
 *
 * tagModel field:
 *   Stores which collection `tag` points to ("Tag" or "DefaultTag") so
 *   analytics and population calls know which model to use without
 *   additional lookups. Set automatically by sessionController.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    //  Tag references

    // The main tag. Null = untagged.
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "tagModel", // dynamic ref — resolves to "Tag" or "DefaultTag"
      default: null,
    },

    // Which model `tag` points to. Must be set whenever `tag` is non-null.
    tagModel: {
      type: String,
      enum: ["Tag", "DefaultTag"],
      default: null,
    },

    // Optional subtag — only valid when tag is a "Tag" (not a DefaultTag).
    subTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubTag",
      default: null,
    },

    //  Time
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null }, // null = still running
    durationSeconds: { type: Number, default: 0 }, // computed on stop

    //  Metadata
    label: { type: String, trim: true, maxlength: 128 },
    notes: { type: String, maxlength: 4000 },
    keywords: [{ type: String, trim: true }],

    //  Status
    isRunning: { type: Boolean, default: true, index: true },

    // Set to true when the user manually edits the session via the Sessions page.
    // Edited sessions are excluded from the public leaderboard (to prevent
    // time-padding abuse) but are still counted in the user's own analytics.
    isEdited: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

//  Indexes
sessionSchema.index({ user: 1, startedAt: -1 });
sessionSchema.index({ user: 1, tag: 1, startedAt: -1 });
sessionSchema.index({ user: 1, subTag: 1, startedAt: -1 });

export default mongoose.model("Session", sessionSchema);