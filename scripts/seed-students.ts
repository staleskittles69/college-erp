/**
 * Bulk student seed:
 * 5 branches × 10 sections × 4 years × 60 students = 12,000 students
 * Roll numbers restart at 1 for every branch+year batch.
 *
 * Run: npm run seed:students
 * Requires MONGODB_URI in .env.local
 */
import { config } from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

const BRANCHES = ["CSE", "ECE", "ME", "CE", "EEE"];
const SECTION_COUNT = 10;
const YEARS = [1, 2, 3, 4];
const PER_SECTION = 60;

// Exactly 60 unique names — reused across sections, but no section gets a duplicate
const SECTION_NAMES = [
  "Aarav Sharma",    "Arjun Verma",     "Amit Singh",      "Ananya Kumar",
  "Priya Patel",     "Rohit Reddy",     "Sneha Nair",      "Vikram Gupta",
  "Neha Joshi",      "Rahul Mehta",     "Pooja Yadav",     "Karan Mishra",
  "Divya Iyer",      "Siddharth Pillai","Meera Chatterjee","Aditya Bose",
  "Kavya Chopra",    "Rajesh Malhotra", "Lakshmi Kapoor",  "Nikhil Pandey",
  "Shreya Tiwari",   "Varun Saxena",    "Anjali Srivastava","Kunal Agarwal",
  "Swati Dubey",     "Harsh Bhatt",     "Riya Chauhan",    "Akash Jain",
  "Nandini Rao",     "Gaurav Nayak",    "Ishaan Patil",    "Tanvi Kulkarni",
  "Yash Desai",      "Kritika Menon",   "Rohan Hegde",     "Simran Kaur",
  "Dev Ahuja",       "Palak Chawla",    "Manav Sethi",     "Ridhi Batra",
  "Parth Mathur",    "Aditi Ghosh",     "Shrey Banerjee",  "Nisha Deshpande",
  "Vivek Subramaniam","Tanya Murthy",   "Aayush Tripathi", "Preeti Shukla",
  "Kabir Rastogi",   "Deepika Gill",    "Aman Khanna",     "Sonal Chandra",
  "Dhruv Rajan",     "Kriti Sinha",     "Mihir Bahl",      "Ruchika Thakur",
  "Ankit Oberoi",    "Namrata Venkat",  "Pranav Bendre",   "Shruti Lal",
];

async function seedStudents() {
  await mongoose.connect(MONGODB_URI!);

  const User = (await import("../src/models/User")).default;
  const Student = (await import("../src/models/Student")).default;

  console.log("Wiping existing seeded students...");
  const existingStudentUsers = await User.find({ role: "student" }).select("_id").lean();
  const existingIds = existingStudentUsers.map((u) => u._id);
  await User.deleteMany({ role: "student" });
  await Student.deleteMany({ userId: { $in: existingIds } });

  console.log("Hashing password...");
  const hashedPassword = await bcrypt.hash("student123", 10);

  const userDocs: object[] = [];
  const studentDocs: object[] = [];

  for (const year of YEARS) {
    const semester = year * 2 - 1; // year 1→sem 1, year 2→sem 3, etc.
    const batchYear = 26 - year;   // year 1→batch 25, year 4→batch 22

    for (const branch of BRANCHES) {
      let rollCounter = 1; // roll numbers restart at 1 for each branch+year batch

      for (let sec = 1; sec <= SECTION_COUNT; sec++) {
        const sectionLabel = `Section ${sec}`;

        for (let i = 0; i < PER_SECTION; i++) {
          const userId = new mongoose.Types.ObjectId();
          const name = SECTION_NAMES[i]; // unique within section, repeats across sections
          const rollNumber = rollCounter++;
          const rollNo = `${batchYear}${branch.slice(0, 2)}S${String(sec).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`;
          const email = `${branch.toLowerCase()}${year}.${sectionLabel.replace(" ", "").toLowerCase()}.${rollNumber}@college.edu`;

          userDocs.push({
            _id: userId,
            name,
            email,
            rollNumber,
            branch,
            year,
            section: sectionLabel,
            password: hashedPassword,
            role: "student",
          });

          studentDocs.push({
            userId,
            name,
            rollNo,
            branch,
            semester,
            section: sectionLabel,
          });
        }
      }
    }
  }

  const BATCH = 1000;
  console.log(`Inserting ${userDocs.length} users in batches...`);
  for (let i = 0; i < userDocs.length; i += BATCH) {
    await User.insertMany(userDocs.slice(i, i + BATCH), { ordered: false });
    process.stdout.write(`\r  Users: ${Math.min(i + BATCH, userDocs.length)} / ${userDocs.length}`);
  }

  console.log(`\nInserting ${studentDocs.length} student records in batches...`);
  for (let i = 0; i < studentDocs.length; i += BATCH) {
    await Student.insertMany(studentDocs.slice(i, i + BATCH), { ordered: false });
    process.stdout.write(`\r  Students: ${Math.min(i + BATCH, studentDocs.length)} / ${studentDocs.length}`);
  }

  console.log(`\nDone! Seeded ${studentDocs.length} students.`);
  console.log(`Roll numbers restart at 1 for every branch+year batch | Password: student123`);

  await mongoose.disconnect();
}

seedStudents().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
