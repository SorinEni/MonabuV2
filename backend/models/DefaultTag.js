import mongoose from "mongoose";

/**
 * DefaultTag — platform-wide tags managed by developers.
 *
 * Rules for users:
 *   - Read-only: cannot edit, delete, or archive.
 *   - Can hide from the tracker via UserDefaultTagPreference (separate collection).
 *   - Always available to all users regardless of plan.
 *
 * Rules for developers (enforced at router level):
 *   - Full CRUD.
 *   - Deactivating (isActive: false) removes the tag from all pickers for
 *     new sessions but preserves existing session references.
 */
const defaultTagSchema = new mongoose.Schema(
  {
    // Stable i18n key, e.g. "math", "history".
    // Lowercase letters, digits, _ or - only.
    // Used by the frontend to resolve a translated display name via locale lookup.
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 64,
      validate: {
        validator: (v) => /^[a-z0-9_-]+$/.test(v),
        message: "key may only contain a-z, 0-9, _ or -",
      },
    },

    // English display name (fallback when no translation exists).
    name: { type: String, required: true, trim: true, maxlength: 64 },

    color: { type: String, default: "#93c5fd" },

    // Controls sort order in pickers.
    order: { type: Number, default: 0 },

    // Developers can deactivate without deleting.
    // Deactivated tags are hidden from session pickers but preserved for stats.
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

//  Indexes
defaultTagSchema.index({ order: 1, createdAt: 1 });

export default mongoose.model("DefaultTag", defaultTagSchema);
