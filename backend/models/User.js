import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getPlanConfigSync } from "#utils/plans";

const userSchema = new mongoose.Schema(
  {
    //   Identity
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 32,
    },
    tempUsername: { type: Boolean, default: false },

    name: { type: String, trim: true },
    nameLastChangedAt: { type: Date, default: null },
    passwordHash: { type: String },

    //   Google OAuth
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },

    //   Onboarding / Goals
    primaryGoal: {
      type: String,
      enum: [
        "none",
        "work",
        "school",
        "fitness",
        "learning",
        "reading",
        "habits",
        "productivity",
      ],
      default: "none",
    },
    weeklyHourGoal: { type: Number, default: 80, min: 1, max: 80 },

    //   Preferences
    themePreference: {
      type: String,
      enum: ["dark", "light"],
      default: "dark",
    },

    //   Subscription
    plan: {
      type: String,
      enum: ["free", "pro", "pro+", "team", "earlyaccess"],
      default: "earlyaccess",
      trim: true,
      lowercase: true,
    },
    planExpiresAt: { type: Date },
    stripeCustomerId: { type: String },

    //   Location / misc
    registrationIp: { type: String, default: null },
    lastIp: { type: String, default: null },
    countryCode: { type: String, default: null },
    countryName: { type: String, default: null },
    timezone: { type: String, default: "UTC" },
    language: { type: String, default: "en" },
    geoResolved: { type: Boolean, default: false },

    //   Pomodoro preferences
    pomoSettings: {
      workMins: { type: Number, default: 25, min: 1, max: 360 },
      shortBreakMins: { type: Number, default: 5, min: 1, max: 120 },
      longBreakMins: { type: Number, default: 15, min: 1, max: 120 },
      totalSessions: { type: Number, default: 4, min: 1, max: 20 },
      longBreakEvery: { type: Number, default: 4, min: 0, max: 10 },
      autoStartBreak: { type: Boolean, default: true },
      autoStartWork: { type: Boolean, default: false },
    },

    //   Aura — daily give budget lives in AuraDailyUsage collection (TTL-based reset)
    auraReceived: { type: Number, default: 0, min: 0 },

    //   Email verification
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null },

    //   Password reset
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpiresAt: { type: Date, default: null },

    //   Status
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    isDeveloper: { type: Boolean, default: false },
    pendingEmail: { type: String, lowercase: true, trim: true },
    lastSeenAt: { type: Date, default: Date.now },

    tokenVersion: { type: Number, default: 0 },

    scheduledDeletionAt: { type: Date, default: null },
    leaderboardPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index(
  { scheduledDeletionAt: 1 },
  { expireAfterSeconds: 0, sparse: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash") || !this.passwordHash) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.stripeCustomerId;
  delete obj.googleId;
  delete obj.verificationToken;
  delete obj.verificationTokenExpiresAt;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordTokenExpiresAt;
  delete obj.registrationIp;
  delete obj.lastIp;
  delete obj.__v;
  obj.hasPassword = Boolean(this.passwordHash);
  obj.leaderboardPublic = this.leaderboardPublic !== false;

  const planConfig = getPlanConfigSync(this.plan);
  if (planConfig) {
    obj.planLimits = {
      activeTagLimit: planConfig.activeTagLimit,
      archivedTagLimit: planConfig.archivedTagLimit,
      subtagLimit: planConfig.subtagLimit,
      analyticsDays: planConfig.analyticsDays,
    };
    obj.planFeatures = planConfig.features;
    obj.planIsLifetime = planConfig.isLifetime;
  }

  return obj;
};

userSchema.methods.toAdmin = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.stripeCustomerId;
  delete obj.googleId;
  delete obj.verificationToken;
  delete obj.verificationTokenExpiresAt;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordTokenExpiresAt;
  delete obj.registrationIp;
  delete obj.lastIp;
  delete obj.__v;
  obj.hasPassword = Boolean(this.passwordHash);
  obj.leaderboardPublic = this.leaderboardPublic !== false;

  const planConfig = getPlanConfigSync(this.plan);
  if (planConfig) {
    obj.planLimits = {
      activeTagLimit: planConfig.activeTagLimit,
      archivedTagLimit: planConfig.archivedTagLimit,
      subtagLimit: planConfig.subtagLimit,
      analyticsDays: planConfig.analyticsDays,
    };
    obj.planFeatures = planConfig.features;
    obj.planIsLifetime = planConfig.isLifetime;
  }

  return obj;
};

export default mongoose.model("User", userSchema);
