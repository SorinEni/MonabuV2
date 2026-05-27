import "dotenv/config";
import mongoose from "mongoose";
import DefaultTag from "#models/DefaultTag"; // ← was Tag, now DefaultTag
import { DEFAULT_TAGS } from "#constants/defaultTags";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1"]);

async function seed() {
  console.log("Attempting to connect database...");
  try {
    const username = encodeURIComponent(process.env.MONGO_USER);
    const password = encodeURIComponent(process.env.MONGO_PASS);
    const ip = process.env.MONGO_IP;
    const dbName = process.env.MONGO_DB;
    const uri = `mongodb://${username}:${password}@${ip}:27017/${dbName}?authSource=admin`;

    await mongoose.connect(uri);
    console.log("✅  MongoDB connected");

    // Reset: wipe all DefaultTag documents (not Tag documents)
    if (process.env.RESET === "true") {
      await DefaultTag.deleteMany({});
      console.log("🗑️   Reset: deleted all default tags");
    }

    const ops = DEFAULT_TAGS.map((tag) => ({
      updateOne: {
        filter: { key: tag.key }, // ← no `type` field on DefaultTag
        update: {
          $setOnInsert: {
            key: tag.key,
            name: tag.name,
            color: tag.color,
            order: tag.order ?? 0,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await DefaultTag.bulkWrite(ops, { ordered: false });

    console.log(`✅  Seeded ${DEFAULT_TAGS.length} default tags`);
    console.log(`    Inserted : ${result.upsertedCount}`);
    console.log(`    Skipped  : ${result.matchedCount} (already existed)`);
  } catch (err) {
    console.error("❌  Failed to connect or seed MongoDB:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌  Disconnected");
  }
}

seed();
