/**
 * One-time copy of the Atlas database into the local MongoDB for the offline demo.
 * Run: npx tsx scripts/copy-atlas-to-local.ts
 * Reads MONGODB_URI (Atlas) from .env.local. Only READS from Atlas.
 * Target defaults to mongodb://127.0.0.1:27017/college_erp_demo (override with LOCAL_URI).
 * Wipes each target collection before copying so re-runs are safe.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { MongoClient } from "mongodb";

config({ path: resolve(process.cwd(), ".env.local") });

const ATLAS_URI = process.env.MONGODB_URI;
const LOCAL_URI = process.env.LOCAL_URI ?? "mongodb://127.0.0.1:27017/college_erp_demo";
const BATCH = 1000;

if (!ATLAS_URI || !ATLAS_URI.startsWith("mongodb+srv://")) {
  console.error("Error: .env.local MONGODB_URI is missing or is not an Atlas (mongodb+srv) URI");
  process.exit(1);
}

// The target gets every collection wiped, so refuse anything but this machine unless explicitly allowed.
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(LOCAL_URI) && process.env.ALLOW_REMOTE_TARGET !== "1") {
  console.error("Error: LOCAL_URI must point to localhost — its collections get wiped (set ALLOW_REMOTE_TARGET=1 to override)");
  process.exit(1);
}

async function main() {
  const atlas = new MongoClient(ATLAS_URI!, { serverSelectionTimeoutMS: 15000 });
  const local = new MongoClient(LOCAL_URI, { serverSelectionTimeoutMS: 5000 });
  await atlas.connect();
  await local.connect();

  const src = atlas.db();
  const dst = local.db();
  console.log(`Source DB: ${src.databaseName} -> Target DB: ${dst.databaseName}`);

  const collections = (await src.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  for (const name of collections) {
    const from = src.collection(name);
    const to = dst.collection(name);
    await to.deleteMany({});

    let copied = 0;
    let buf: object[] = [];
    for await (const doc of from.find({})) {
      buf.push(doc);
      if (buf.length >= BATCH) {
        await to.insertMany(buf as never[], { ordered: false });
        copied += buf.length;
        buf = [];
      }
    }
    if (buf.length) {
      await to.insertMany(buf as never[], { ordered: false });
      copied += buf.length;
    }

    const [srcCount, dstCount] = await Promise.all([from.countDocuments(), to.countDocuments()]);
    console.log(`${name}: atlas=${srcCount} local=${dstCount}${srcCount === dstCount ? "" : "  <-- MISMATCH"} (copied ${copied})`);
  }

  await atlas.close();
  await local.close();
  console.log("Copy done.");
}

main().catch((err) => {
  console.error("Copy failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
