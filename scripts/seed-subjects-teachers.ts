/**
 * Seeds 3 branch-accurate subjects per branch, with 3 teachers each
 * (assigned to teach every year/section of their branch, so they show
 * up as "assigned teachers" for any student in that branch).
 *
 * Run: npm run seed:subjects
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

const DEPARTMENTS = [
  { slug: "cse", branch: "CSE", label: "Computer Science & Engineering", color: "border-indigo-200 hover:border-indigo-400" },
  { slug: "ece", branch: "ECE", label: "Electronics & Communication", color: "border-blue-200 hover:border-blue-400" },
  { slug: "me", branch: "ME", label: "Mechanical Engineering", color: "border-orange-200 hover:border-orange-400" },
  { slug: "ce", branch: "CE", label: "Civil Engineering", color: "border-green-200 hover:border-green-400" },
  { slug: "eee", branch: "EEE", label: "Electrical & Electronics Engineering", color: "border-rose-200 hover:border-rose-400" },
];

const SUBJECTS_BY_SLUG: Record<string, string[]> = {
  cse: ["Data Structures & Algorithms", "Operating Systems", "Database Management Systems"],
  ece: ["Digital Signal Processing", "Analog Electronics", "Communication Systems"],
  me: ["Thermodynamics", "Fluid Mechanics", "Machine Design"],
  ce: ["Structural Analysis", "Geotechnical Engineering", "Surveying"],
  eee: ["Power Systems", "Electrical Machines", "Control Systems"],
};

// 45 distinct faculty names — 3 per subject, 5 branches x 3 subjects
const TEACHER_NAMES = [
  "Dr. Ramesh Iyer", "Dr. Sunita Rao", "Prof. Anand Kulkarni",
  "Dr. Meenakshi Pillai", "Prof. Vikas Choudhary", "Dr. Kavitha Menon",
  "Prof. Suresh Nair", "Dr. Anita Bhatia", "Prof. Rajiv Malhotra",
  "Dr. Deepa Krishnan", "Prof. Manoj Tiwari", "Dr. Sarita Joshi",
  "Prof. Ashok Verma", "Dr. Lata Mishra", "Prof. Vinod Kumar",
  "Dr. Poonam Chawla", "Prof. Sanjay Gupta", "Dr. Nalini Reddy",
  "Prof. Ravi Shankar", "Dr. Geeta Agarwal", "Prof. Mahesh Bhatt",
  "Dr. Shalini Sharma", "Prof. Dinesh Yadav", "Dr. Rekha Saxena",
  "Prof. Naveen Chopra", "Dr. Padma Subramaniam", "Prof. Arvind Desai",
  "Dr. Usha Pandey", "Prof. Girish Kapoor", "Dr. Vandana Dubey",
  "Prof. Rakesh Sinha", "Dr. Jyoti Bose", "Prof. Prakash Menon",
  "Dr. Sushma Rao", "Prof. Nitin Bhatt", "Dr. Renu Kapil",
  "Prof. Sunil Chandra", "Dr. Anjali Deshmukh", "Prof. Vijay Anand",
  "Dr. Kalpana Iyer", "Prof. Harish Trivedi", "Dr. Mamta Sethi",
  "Prof. Ajay Bhatia", "Dr. Neelam Rathi", "Prof. Ramesh Babu",
];

const ALL_SECTIONS = Array.from({ length: 10 }, (_, i) => `Section ${i + 1}`);
const ALL_YEARS = [1, 2, 3, 4];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const Department = (await import("../src/models/Department")).default;
  const Subject = (await import("../src/models/Subject")).default;
  const User = (await import("../src/models/User")).default;
  const Teacher = (await import("../src/models/Teacher")).default;

  let nameIdx = 0;
  let subjectsCreated = 0;
  let teachersCreated = 0;

  for (const dept of DEPARTMENTS) {
    await Department.updateOne(
      { slug: dept.slug },
      { $setOnInsert: { slug: dept.slug, name: dept.branch, label: dept.label, color: dept.color } },
      { upsert: true }
    );

    for (const subjectName of SUBJECTS_BY_SLUG[dept.slug]) {
      let subject = await Subject.findOne({ department: dept.slug, name: subjectName });
      if (!subject) {
        subject = await Subject.create({ name: subjectName, department: dept.slug, teacherIds: [] });
        subjectsCreated++;
        console.log(`Created subject: ${subjectName} (${dept.slug})`);
      }

      for (let i = 1; i <= 3; i++) {
        const teacherName = TEACHER_NAMES[nameIdx++];
        const email = `${slugify(teacherName)}.${dept.slug}@college.edu`;

        let user = await User.findOne({ email });
        if (!user) {
          const hashedPassword = await bcrypt.hash("teacher123", 10);
          user = await User.create({ name: teacherName, email, password: hashedPassword, role: "teacher" });
        }

        let teacher = await Teacher.findOne({ userId: user._id });
        if (!teacher) {
          teacher = await Teacher.create({
            userId: user._id,
            name: teacherName,
            employeeId: `EMP${dept.slug.toUpperCase()}${Date.now()}${i}`,
            department: dept.slug,
            teaching: ALL_YEARS.map((year) => ({ branch: dept.branch, year, sections: ALL_SECTIONS })),
          });
          teachersCreated++;
          console.log(`Created teacher: ${teacherName} (${email}) — ${dept.slug}`);
        }

        const alreadyAssigned = subject.teacherIds.some(
          (id: mongoose.Types.ObjectId) => id.toString() === teacher!._id.toString()
        );
        if (!alreadyAssigned) subject.teacherIds.push(teacher._id);
      }

      await subject.save();
    }
  }

  await mongoose.disconnect();
  console.log(`Done. Subjects created: ${subjectsCreated}, teachers created: ${teachersCreated}. Password for all new teachers: teacher123`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
