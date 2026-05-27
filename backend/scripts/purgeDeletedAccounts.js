
import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1"]);

import User from "#models/User";
import Session from "#models/Session";
import Tag from "#models/Tag";


const ROOT = process.cwd();

async function purge() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`[purge] Connected — ${new Date().toISOString()}`);

  //  Step 1: collect all userIds referenced in other collections
  const [sessionUserIds, tagUserIds, fameFromIds, fameToIds] =
    await Promise.all([
      Session.distinct("user"),
      Tag.distinct("user", { type: "user" }), // only personal tags have a user
      Fame.distinct("from"),
      Fame.distinct("to"),
    ]);

  // Union of all referenced IDs (as strings for easy Set lookup)
  const allReferencedIds = new Set(
    [...sessionUserIds, ...tagUserIds, ...fameFromIds, ...fameToIds].map(
      String,
    ),
  );

  if (!allReferencedIds.size) {
    console.log("[purge] No referenced user IDs found — nothing to do.");
    await mongoose.disconnect();
    return;
  }

  //  Step 2: find which of those IDs still have a User document
  const existingUsers = await User.find({
    _id: { $in: [...allReferencedIds] },
  })
    .select("_id")
    .lean();

  const existingIds = new Set(existingUsers.map((u) => String(u._id)));

  // Orphaned = referenced but no longer in the users collection
  const orphanedIds = [...allReferencedIds].filter(
    (id) => !existingIds.has(id),
  );

  if (!orphanedIds.length) {
    console.log("[purge] No orphaned data — all referenced users still exist.");
    await mongoose.disconnect();
    return;
  }

  console.log(
    `[purge] Found ${orphanedIds.length} orphaned user ID(s) — cleaning up.`,
  );

  //  Step 3: delete orphaned documents from all collections
  const objectIds = orphanedIds.map((id) => new mongoose.Types.ObjectId(id));

  const [sessionResult, tagResult, fameResult] = await Promise.all([
    Session.deleteMany({ user: { $in: objectIds } }),
    Tag.deleteMany({ type: "user", user: { $in: objectIds } }),
    Fame.deleteMany({
      $or: [{ from: { $in: objectIds } }, { to: { $in: objectIds } }],
    }),
  ]);

  console.log(`[purge] Sessions deleted : ${sessionResult.deletedCount}`);
  console.log(`[purge] Tags deleted     : ${tagResult.deletedCount}`);
  console.log(`[purge] Fame deleted     : ${fameResult.deletedCount}`);

  //  Step 4: clean up local avatar files
  // The User document is already gone so we can't look up the avatar path.
  // Instead, scan the avatars directory and remove any file that isn't
  // referenced by any currently existing user. Google/CDN avatars are remote
  // URLs and are never stored in this directory, so this is safe.
  const avatarDir = path.join(ROOT, "uploads/avatars");
  if (fs.existsSync(avatarDir)) {
    const activeAvatars = await User.find({
      avatar: { $regex: "^/uploads/avatars/" },
    })
      .select("avatar")
      .lean();

    const activeFilenames = new Set(
      activeAvatars.map((u) => path.basename(u.avatar)),
    );

    const files = fs.readdirSync(avatarDir);
    let removed = 0;
    for (const file of files) {
      if (!activeFilenames.has(file)) {
        fs.unlink(path.join(avatarDir, file), (err) => {
          if (err)
            console.warn(
              `[purge] Could not delete avatar ${file}:`,
              err.message,
            );
        });
        removed++;
      }
    }
    if (removed)
      console.log(`[purge] Avatar files queued for deletion: ${removed}`);
  }

  console.log("[purge] Done.");
  await mongoose.disconnect();
}

export { purge };
