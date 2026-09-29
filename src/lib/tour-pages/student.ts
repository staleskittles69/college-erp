// Per-page tours for the student portal. The data-tour="…" markers these point at live in each page's JSX.
import type { PageTour } from "../tour-steps";
import { tourTarget } from "./shared";

export const STUDENT_PAGES: PageTour[] = [
  {
    path: "/student",
    intro: { title: "Your Dashboard", description: "Your home page — a quick look at how you're doing and what's on today." },
    steps: [
      {
        element: tourTarget("attendance-card"),
        title: "Overall Attendance",
        description: "The share of all your classes you've attended, across every subject. Green means 75% or more (good standing), amber is 50–74%, red is below 50%.",
      },
      {
        element: tourTarget("cgpa-card"),
        title: "Cumulative GPA",
        description: "Your CGPA out of 10, worked out from all the marks entered so far. It shows “—” until your first marks are added.",
      },
      {
        element: tourTarget("upcoming-card"),
        title: "Upcoming Deadlines",
        description: "Tests and assignments coming up, soonest first. The coloured chip is the date; the tag says whether it's a Test or an Assignment, with its total marks.",
      },
      {
        element: tourTarget("today-classes"),
        title: "Today's Classes",
        description: "Today's periods in order, each with its time and room. Use “View full timetable” to see the whole week.",
      },
      {
        element: tourTarget("notice-board"),
        title: "Notice Board",
        description: "The latest notices from the college and your teachers. Pinned (yellow) notices are the important ones and stay at the top.",
      },
    ],
  },
  {
    path: "/student/courses",
    intro: { title: "Courses", description: "Every subject you're taking this semester, taken from your timetable." },
    steps: [
      {
        element: tourTarget("course-list"),
        title: "Your subjects",
        description: "One card per subject. If a subject is missing, your timetable hasn't been fully set up yet — ask the admin office.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/assignments",
    intro: { title: "Assignments & Tests", description: "Everything your teachers have scheduled for your class, with dates so you can plan ahead." },
    steps: [
      {
        element: tourTarget("upcoming-tests"),
        title: "Upcoming",
        description: "Tests and assignments still to come. Each row shows the title, whether it's a Test or Assignment, the subject, the date and the total marks. Click a row with an arrow to see the due time, notes and any attached file.",
        optional: true,
      },
      {
        element: tourTarget("past-tests"),
        title: "Past",
        description: "Ones whose date has already gone by, greyed out so you can still look back at them.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/attendance",
    intro: { title: "Attendance", description: "Your attendance, overall and for each subject. Colleges usually expect at least 75%." },
    steps: [
      {
        element: tourTarget("attendance-summary"),
        title: "Summary",
        description: "Present = classes you attended, Absent = classes you missed, Overall = the percentage you attended.",
        optional: true,
      },
      {
        element: tourTarget("attendance-warning"),
        title: "Attendance warning",
        description: "Subjects where you're below 75%, and exactly how many more classes you need to attend to get back to 75%.",
        optional: true,
      },
      {
        element: tourTarget("attendance-subjects"),
        title: "Subject-wise attendance",
        description: "One circle per subject. The number in the middle is your percentage; underneath is classes attended out of classes held. Green is 75%+, amber 50–74%, red below 50%.",
        optional: true,
      },
      {
        element: tourTarget("attendance-records"),
        title: "Recent records",
        description: "Your last 20 marked classes: the subject, the date, and whether you were Present or Absent.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/grades",
    intro: { title: "Grades", description: "Your marks for every exam, subject by subject." },
    steps: [
      {
        element: tourTarget("grades-table"),
        title: "Your marks",
        description: "Subject = the course. Exam = which exam the marks are for. Marks = what you scored out of the total, with the percentage in brackets. Grade = the letter grade for that score.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/announcements",
    intro: { title: "Announcements", description: "All notices from the college and your teachers, newest first." },
    steps: [
      {
        element: tourTarget("notice-list"),
        title: "Notices",
        description: "Each notice has a title, the message and the date it was posted. Pinned notices (yellow) are the important ones.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/timetable",
    intro: { title: "Timetable", description: "Your class schedule for the whole week." },
    steps: [
      {
        element: tourTarget("timetable-day"),
        title: "One card per day",
        description: "Each box is one class: the time on top, then the subject, then the room. Days with no classes are left out.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/messages",
    intro: { title: "Queries", description: "Ask the admin office or one of your teachers a question, and see their reply here." },
    steps: [
      {
        element: tourTarget("query-recipient"),
        title: "Send To",
        description: "Choose who should answer: the Admin office, or one of the teachers who teaches your class.",
      },
      {
        element: tourTarget("query-form"),
        title: "Write your query",
        description: "Give it a short subject line, explain your question in the message box, then click Send Query.",
      },
      {
        element: tourTarget("query-list"),
        title: "Your Queries",
        description: "Everything you've sent. Open (amber) = waiting for a reply. Resolved (green) = answered — the reply shows in the green box underneath.",
      },
    ],
  },
  {
    path: "/student/forums",
    intro: { title: "Forums", description: "Group chats with other students. Teachers can join in too, to help out or keep things on track." },
    steps: [
      {
        element: tourTarget("forum-list"),
        title: "Forum list",
        description: "All the forums, with how many messages each has and the latest one. Click a forum to open it.",
      },
      {
        element: tourTarget("forum-new"),
        title: "Start a forum",
        description: "Click New to create your own forum on any topic, like a study group for one subject.",
      },
      {
        element: tourTarget("forum-chat"),
        title: "Chat",
        description: "The open forum's messages appear here, with a box at the bottom to write yours. Type @ to mention a teacher so they get notified. You can delete your own messages, and rename or delete forums you created.",
      },
    ],
  },
  {
    path: "/student/resources",
    intro: { title: "Resources", description: "Notes, PDFs and other study material your teachers have shared." },
    steps: [
      {
        element: tourTarget("resource-list"),
        title: "Grouped by subject",
        description: "Each file shows its title and the date it was shared. Click one to open or download it.",
        optional: true,
      },
    ],
  },
  {
    path: "/student/profile",
    intro: { title: "Profile", description: "Everything the college has on record for you. It's read-only — if something is wrong, contact the admin office." },
    steps: [
      {
        element: tourTarget("profile-hero"),
        title: "You",
        description: "Your name, with your branch, semester and section.",
      },
      {
        element: tourTarget("profile-cards"),
        title: "Key details",
        description: "Your roll number (which is also your login), email, branch and section.",
      },
      {
        element: tourTarget("profile-personal"),
        title: "Personal Details",
        description: "Admission number, date of birth, entrance rank, contact numbers, ID numbers and similar. A “—” means it hasn't been filled in.",
      },
      {
        element: tourTarget("profile-education"),
        title: "Education Details",
        description: "Your earlier schooling (e.g. 10th and Intermediate): board, hall ticket number, year passed, institute and marks.",
        optional: true,
      },
      {
        element: tourTarget("profile-parents"),
        title: "Parent's Details",
        description: "Your parents' names, jobs, phone numbers, emails and addresses.",
      },
      {
        element: tourTarget("profile-guardian"),
        title: "Guardian Details",
        description: "Your local guardian's name, contact numbers and address, if you have one.",
      },
    ],
  },
  {
    path: "/student/settings",
    intro: { title: "Settings", description: "Manage your account." },
    steps: [
      {
        element: tourTarget("password-form"),
        title: "Change Password",
        description: "Type your current password, then your new one twice (so we know there's no typo), and click Update Password.",
      },
    ],
  },
];
