import mongoose from "mongoose";

/**
 * Tag — personal tags created by a user.
 *
 * Rules:
 *   - Visible only to the owning user.
 *   - User can edit name/color, archive, hide from tracker, or delete.
 *   - Deleting a Tag cascades: all SubTags and all Sessions referencing
 *     this tag (or any of its subtags) are also deleted.
 *     This cascade is handled in tagController, not via a Mongoose hook,
 *     so the caller has full control and visibility over what gets removed.
 *
 * Plan limits (enforced in tagController):
 *   free  → 5 active  /  5 archived
 *   pro   → unlimited /  unlimited
 *   team  → unlimited /  unlimited
 */
const tagSchema = new mongoose.Schema(
  {
    //  Ownership
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    //  Core fields
    name: { type: String, required: true, trim: true, maxlength: 64 },
    color: { type: String, default: "#93c5fd" },
    order: { type: Number, default: 0 },

    //  Lifecycle
    // "active"   → shown in session picker, counts toward the active limit.
    // "archived" → excluded from picker, preserved in statistics.
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    // Hides the tag from the tracker/session picker without archiving.
    // Does not affect statistics. Independent of status.
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

//  Indexes

// One tag name per user (prevents duplicates).
tagSchema.index({ user: 1, name: 1 }, { unique: true });

// Fast lookup for picker and settings panel.
tagSchema.index({ user: 1, status: 1, isHidden: 1 });
tagSchema.index({ user: 1, order: 1 });

export default mongoose.model("Tag", tagSchema);
