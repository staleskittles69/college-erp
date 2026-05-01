/**
 * Bulk student seed:
 * 5 branches × 30 sections × 4 years × 60 students = 36,000 students
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
const SECTION_COUNT = 30;
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

  const existingCount = await Student.countDocuments();
  if (existingCount >= 100) {
    console.log(`Already have ${existingCount} students — drop the collection first to re-seed.`);
    await mongoose.disconnect();
    return;
  }

  console.log("Hashing password...");
  const hashedPassword = await bcrypt.hash("student123", 10);

  // Start roll numbers after any existing ones
  const maxUser = await User.findOne({ role: "student" }).sort({ rollNumber: -1 });
  let rollCounter = maxUser?.rollNumber ? maxUser.rollNumber + 1 : 10001;

  const userDocs: object[] = [];
  const studentDocs: object[] = [];

  for (const year of YEARS) {
    const semester = year * 2 - 1; // year 1→sem 1, year 2→sem 3, etc.
    const batchYear = 26 - year;   // year 1→batch 25, year 4→batch 22

    for (const branch of BRANCHES) {
      for (let sec = 1; sec <= SECTION_COUNT; sec++) {
        const sectionLabel = `Section ${sec}`;

        for (let i = 0; i < PER_SECTION; i++) {
          const userId = new mongoose.Types.ObjectId();
          const name = SECTION_NAMES[i]; // unique within section, repeats across sections
          const rollNo = `${batchYear}${branch.slice(0, 2)}S${String(sec).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`;

          userDocs.push({
            _id: userId,
            name,
            rollNumber: rollCounter++,
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
  console.log(`Roll numbers: ${10001} – ${rollCounter - 1} | Password: student123`);

  await mongoose.disconnect();
}

seedStudents().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
