/**
 * Seeds a handful of example forums (with a few messages each) so the
 * Forums feature isn't empty during local testing. Uses real existing
 * student/teacher accounts as authors — run seed:students first.
 *
 * Run: npm run seed:forums
 * Requires MONGODB_URI in .env.local
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function seedForums() {
  await mongoose.connect(MONGODB_URI!);

  const User = (await import("../src/models/User")).default;
  const Forum = (await import("../src/models/Forum")).default;
  const ForumMessage = (await import("../src/models/ForumMessage")).default;

  interface SeedUser { _id: mongoose.Types.ObjectId; name: string }

  const students = await User.find({ role: "student" }).select("_id name").limit(5).lean<SeedUser[]>();
  const teachers = await User.find({ role: "teacher" }).select("_id name").limit(1).lean<SeedUser[]>();

  if (students.length === 0) {
    console.error("No student accounts found — run `npm run seed:students` first.");
    process.exit(1);
  }

  console.log("Clearing existing forums...");
  await Forum.deleteMany({});
  await ForumMessage.deleteMany({});

  const [s1, s2, s3, s4] = students.map((s) => s ?? students[0]);
  const teacher = teachers[0];

  const forumSeeds = [
    {
      name: "DBMS Study Group",
      creator: s1,
      messages: [
        { from: s1, text: "Anyone free to go over normalization before the quiz tomorrow?" },
        { from: s2, text: "I'm down. 3NF is still confusing me a bit." },
        teacher && { from: teacher, text: "Happy to jump on a call if a few of you want a quick recap session." },
      ],
    },
    {
      name: "Placement Season Tips",
      creator: s2,
      messages: [
        { from: s2, text: "What are people using to prep for the aptitude round?" },
        { from: s3, text: "IndiaBix + a bit of GeeksforGeeks for the coding round has worked for me." },
      ],
    },
    {
      name: "Campus Fest Planning",
      creator: s3,
      messages: [
        { from: s3, text: "Who's signing up for the hackathon this year?" },
        { from: s4, text: "Me! Looking for a 3rd teammate if anyone's interested." },
      ],
    },
    {
      name: "Random / Off-topic",
      creator: s4,
      messages: [
        { from: s4, text: "Canteen has added a new menu, the sandwiches are actually good now" },
        { from: s1, text: "finally lol" },
      ],
    },
  ];

  for (const seed of forumSeeds) {
    const forum = await Forum.create({
      name: seed.name,
      createdByUserId: seed.creator._id,
      createdByName: seed.creator.name,
    });

    for (const message of seed.messages) {
      if (!message) continue;
      await ForumMessage.create({
        forumId: forum._id,
        senderUserId: message.from._id,
        senderName: message.from.name ?? "Unknown",
        senderRole: teacher && message.from._id.equals(teacher._id) ? "teacher" : "student",
        text: message.text,
      });
    }

    console.log(`Created forum "${forum.name}"`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

seedForums().catch((error) => {
  console.error(error);
  process.exit(1);
});
