import mongoose from "mongoose";
import "dotenv/config"; // Make sure to load your .env variables
import User from "#models/User"; // Adjust this import path if needed

async function runMigration() {
  console.log("Attempting to connect to database...");

  try {
    // 1. Connect to MongoDB using your existing environment variables
    const username = encodeURIComponent(process.env.MONGO_USER);
    const password = encodeURIComponent(process.env.MONGO_PASS);
    const ip = process.env.MONGO_IP;
    const dbName = process.env.MONGO_DB;
    const uri = `mongodb://${username}:${password}@${ip}:27017/${dbName}?authSource=admin`;

    await mongoose.connect(uri);
    console.log("MongoDB connected. Running migration...");

    // 2. Run your specific update query
    const result = await User.updateMany(
      { auraReceived: { $exists: false } },
      {
        $set: {
          auraReceived: 0,
          auraToGive: 10,
          auraToGiveResetAt: new Date(),
        },
      },
    );

    // 3. Log the results
    console.log(`✅ Migration complete!`);
    console.log(`Documents matched: ${result.matchedCount}`);
    console.log(`Documents modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    // 4. Always disconnect when finished so the terminal process ends
    await mongoose.disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  }
}

runMigration();
