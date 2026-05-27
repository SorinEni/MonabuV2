import mongoose from "mongoose";

/**
 * UserDefaultTagPreference
 *
 * Tracks per-user preferences for platform default tags.
 * Currently only "isHidden" is stored here, but the schema is designed
 * to be extended (e.g. custom color override, custom display name) without
 * touching the DefaultTag document.
 *
 * A missing document means "default behaviour" (visible, no overrides).
 * A document is created only when the user changes a preference.
 */
const userDefaultTagPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    defaultTag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DefaultTag",
      required: true,
    },

    // When true the tag is hidden from the session picker / tracker.
    // Does NOT affect statistics for sessions already logged with this tag.
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One preference record per (user, defaultTag) pair.
userDefaultTagPreferenceSchema.index(
  { user: 1, defaultTag: 1 },
  { unique: true },
);

// Fast lookup: all hidden default tags for a given user.
userDefaultTagPreferenceSchema.index({ user: 1, isHidden: 1 });

export default mongoose.model(
  "UserDefaultTagPreference",
  userDefaultTagPreferenceSchema,
);
