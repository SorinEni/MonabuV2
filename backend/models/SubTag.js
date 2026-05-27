import mongoose from "mongoose";

/**
 * SubTag — a child category under a user's personal Tag.
 *
 * Examples:
 *   Tag: "Math"  →  SubTags: "Calculus", "Geometry", "Statistics"
 *   Tag: "Code"  →  SubTags: "Frontend", "Backend", "DevOps"
 *
 * Appearance:
 *   - color defaults to null, meaning "inherit from parent Tag".
 *   - When a custom color is set it overrides the parent's color.
 *   - The frontend resolves the effective color as:
 *       subTag.color ?? parentTag.color
 *   - This makes the schema future-proof: color customization per subtag
 *     is already stored; the frontend just needs to start reading it.
 *
 * Lifecycle:
 *   - SubTags are deleted when their parent Tag is deleted (cascade in controller).
 *   - Users can archive or hide subtags independently of the parent tag.
 *   - Deleting a SubTag nullifies the subtag reference on attached Sessions
 *     (sessions keep the parent tag but lose the subtag granularity).
 *     This behaviour is handled explicitly in tagController.
 *
 * Statistics:
 *   - A session referencing a subtag is counted toward BOTH the subtag
 *     AND its parent tag (roll-up semantics).
 */
const subTagSchema = new mongoose.Schema(
  {
    //  Ownership
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Parent tag — required, must belong to the same user.
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      required: true,
      index: true,
    },

    //  Core fields
    name: { type: String, required: true, trim: true, maxlength: 64 },

    // null  → inherit color from parent Tag (default behaviour).
    // string → custom color for this subtag (future customization).
    color: { type: String, default: null },

    order: { type: Number, default: 0 },

    //  Lifecycle
    // "active"   → shown in session picker under the parent tag.
    // "archived" → excluded from picker, preserved in statistics.
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    // Hides the subtag from the session picker without archiving it.
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

//  Indexes

// One subtag name per parent tag.
subTagSchema.index({ tag: 1, name: 1 }, { unique: true });

// Fast lookup: all active/visible subtags for a tag.
subTagSchema.index({ tag: 1, status: 1, isHidden: 1 });

// Fast lookup: all subtags belonging to a user (for bulk ops like tag deletion).
subTagSchema.index({ user: 1, tag: 1 });

export default mongoose.model("SubTag", subTagSchema);
