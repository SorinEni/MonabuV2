import mongoose from "mongoose";

// One document per user per day. TTL index deletes it at the next UTC midnight,
// which is the "reset". Absence = null (user hasn't given today). used = 0 means
// the doc exists but zero points given, which shouldn't normally occur — doc is
// created on the first give.
const auraDailyUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // How many points this user has given out today (1–10).
  used: { type: Number, default: 0, min: 0 },

  // Set to the next UTC midnight on creation so the TTL index fires exactly then.
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

auraDailyUsageSchema.index({ userId: 1 }, { unique: true });

// Returns the next UTC midnight from now.
export function nextUTCMidnight() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

export default mongoose.model("AuraDailyUsage", auraDailyUsageSchema);
