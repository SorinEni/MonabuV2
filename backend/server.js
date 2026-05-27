import path from "node:path";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import express from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { configurePassport } from "#utils/passport";
import router from "#routes/index";
import googleRoutes from "#routes/googleRoutes";
import dns from "node:dns/promises";
import cron from "node-cron";
import { purge } from "#scripts/purgeDeletedAccounts";
import { seedPlans } from "#scripts/seedPlans";
import { refreshPlanCache } from "#utils/plans";

// Runs every day at 4am
cron.schedule("0 4 * * *", () => {
  purge().catch((err) => console.error("[purge] Fatal error:", err.message));
});

//  Setup
dns.setServers(["1.1.1.1"]);
const ROOT = process.cwd();
const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === "production";

// 1. CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// 2. Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Static files
const UPLOADS_PATH = path.join(ROOT, "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

// 4. Passport
configurePassport();
app.use(passport.initialize());

// 5. Rate limit
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Safely falls back if req.ip is missing
      return (
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "unknown-client"
      );
    },
  }),
);

// 6. Routes
app.use("/api/auth/google", googleRoutes);
app.use("/api", router);

// 7. Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    ts: new Date().toISOString(),
  });
});

// 8. 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// 9. Error handler
app.use((err, req, res, _next) => {
  console.error("Global Error:", err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// 10. Start
async function start() {
  console.log("Attempting to connect database...");
  try {
    const username = encodeURIComponent(process.env.MONGO_USER);
    const password = encodeURIComponent(process.env.MONGO_PASS);
    const ip = process.env.MONGO_IP;
    const dbName = process.env.MONGO_DB;
    const uri = `mongodb://${username}:${password}@${ip}:27017/${dbName}?authSource=admin`;

    await mongoose.connect(uri);
    console.log("MongoDB connected");
    await seedPlans();
    await refreshPlanCache();
    app.listen(PORT, () => {
      console.log(`🚀  Monabu API running on http://localhost:${PORT}`);
      console.log(`📋  Environment: ${process.env.NODE_ENV || "development"}`);
      if (!process.env.SESSION_SECRET) {
        console.warn(
          "⚠️  WARNING: SESSION_SECRET not found in .env, using fallback.",
        );
      }
    });
  } catch (err) {
    console.error("❌  Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();
