import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true },
    activeTagLimit: { type: Number, required: true, min: 0 },
    archivedTagLimit: { type: Number, required: true, min: 0 },
    subtagLimit: { type: Number, required: true, min: 0 },
    analyticsDays: { type: Number, default: null, min: 1 },
    isLifetime: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Plan", planSchema);
