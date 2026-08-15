/**
 * Generates a conflict-free weekly timetable for every branch/year/section,
 * using the subjects + teachers already created by seed:subjects. Each
 * subject meets 3x/week per section; a teacher is never double-booked at
 * the same day/period across different sections.
 *
 * Run: npm run seed:timetable
 * Requires MONGODB_URI in .env.local. Run `npm run seed:subjects` first.
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

const DEPARTMENTS = [
  { slug: "cse", branch: "CSE" },
  { slug: "ece", branch: "ECE" },
  { slug: "me", branch: "ME" },
  { slug: "ce", branch: "CE" },
  { slug: "eee", branch: "EEE" },
];

const ALL_SECTIONS = Array.from({ length: 10 }, (_, i) => `Section ${i + 1}`);
const ALL_YEARS = [1, 2, 3, 4];
const DAY_COUNT = 6; // Monday..Saturday, matching src/lib/academics.ts DAYS
const PERIODS = [1, 2, 3, 4, 5, 6];
const PERIOD_TIMES: Record<number, string> = {
  1: "9:00 – 9:50",
  2: "9:50 – 10:40",
  3: "10:55 – 11:45",
  4: "11:45 – 12:35",
  5: "1:20 – 2:10",
  6: "2:10 – 3:00",
};
const MEETINGS_PER_WEEK = 3;

interface Slot { subject: string; period: number; time: string; room: string; }

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const Subject = (await import("../src/models/Subject")).default;
  const Timetable = (await import("../src/models/Timetable")).default;

  // teacherId -> Set of "day|period" already booked, enforced globally across every branch/section.
  const teacherBusy = new Map<string, Set<string>>();
  function isTeacherFree(teacherId: string, day: number, period: number) {
    return !teacherBusy.get(teacherId)?.has(`${day}|${period}`);
  }
  function bookTeacher(teacherId: string, day: number, period: number) {
    if (!teacherBusy.has(teacherId)) teacherBusy.set(teacherId, new Set());
    teacherBusy.get(teacherId)!.add(`${day}|${period}`);
  }

  let timetablesUpserted = 0;
  let meetingsPlaced = 0;
  let meetingsSkipped = 0;

  for (const dept of DEPARTMENTS) {
    const subjects = await Subject.find({ department: dept.slug }).lean();
    if (subjects.length === 0) {
      console.log(`Skipping ${dept.slug}: no subjects found. Run "npm run seed:subjects" first.`);
      continue;
    }

    for (const year of ALL_YEARS) {
      for (let sectionIdx = 0; sectionIdx < ALL_SECTIONS.length; sectionIdx++) {
        const section = ALL_SECTIONS[sectionIdx];
        const slotsByDay: Record<number, Slot[]> = {};
        const occupiedCells = new Set<string>(); // "day|period" already used by this section

        subjects.forEach((subject, subjectIdx) => {
          const teacherIds = (subject.teacherIds ?? []).map((id: mongoose.Types.ObjectId) => id.toString());
          if (teacherIds.length === 0) return;

          let placed = 0;
          outer: for (let dayOffset = 0; dayOffset < DAY_COUNT && placed < MEETINGS_PER_WEEK; dayOffset++) {
            const day = (sectionIdx + subjectIdx + dayOffset) % DAY_COUNT;
            for (let periodOffset = 0; periodOffset < PERIODS.length; periodOffset++) {
              const period = ((sectionIdx * 2 + subjectIdx + periodOffset) % PERIODS.length) + 1;
              const cellKey = `${day}|${period}`;
              if (occupiedCells.has(cellKey)) continue;

              const teacherId = teacherIds.find((id: string) => isTeacherFree(id, day, period));
              if (!teacherId) continue;

              bookTeacher(teacherId, day, period);
              occupiedCells.add(cellKey);
              (slotsByDay[day] ??= []).push({
                subject: subject.name,
                period,
                time: PERIOD_TIMES[period],
                room: `${dept.branch}-${100 + period}`,
              });
              placed++;
              meetingsPlaced++;
              if (placed >= MEETINGS_PER_WEEK) break outer;
            }
          }
          meetingsSkipped += MEETINGS_PER_WEEK - placed;
        });

        for (const [dayStr, slots] of Object.entries(slotsByDay)) {
          const dayOfWeek = Number(dayStr);
          await Timetable.findOneAndUpdate(
            { branch: dept.branch, semester: year, section, dayOfWeek },
            { branch: dept.branch, semester: year, section, dayOfWeek, slots: slots.sort((a, b) => a.period - b.period) },
            { upsert: true }
          );
          timetablesUpserted++;
        }
      }
    }
    console.log(`Scheduled ${dept.branch}.`);
  }

  await mongoose.disconnect();
  console.log(
    `Done. Timetable day-rows upserted: ${timetablesUpserted}. Meetings placed: ${meetingsPlaced}, skipped (no free slot): ${meetingsSkipped}.`
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
