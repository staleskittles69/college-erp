// Per-page tours for the teacher portal. The data-tour="…" markers these point at live in each page's JSX.
import type { PageTour } from "../tour-steps";
import { BREADCRUMB, tourTarget } from "./shared";

const BREADCRUMB_STEP = {
  element: BREADCRUMB,
  title: "Where you are",
  description: "This trail shows how you got here. Click any earlier part to go back up a level.",
};

export const TEACHER_PAGES: PageTour[] = [
  {
    path: "/teachers",
    intro: { title: "Your Dashboard", description: "Your home page — an overview of your classes and what's on today." },
    steps: [
      {
        element: tourTarget("stat-students"),
        title: "Total Students",
        description: "How many students are in all the sections you teach, added together.",
      },
      {
        element: tourTarget("stat-sections"),
        title: "Sections Assigned",
        description: "How many class sections the admin has assigned to you (e.g. CSE Year 2 Section 1 counts as one).",
      },
      {
        element: tourTarget("stat-pending"),
        title: "Pending Assignments",
        description: "Not counted yet — this card is a placeholder and always shows “—” for now.",
      },
      {
        element: tourTarget("stat-notices"),
        title: "Active Notices",
        description: "How many notices are currently posted that you can see. Open Notices in the menu to read them.",
      },
      {
        element: tourTarget("today-classes"),
        title: "Today's Classes",
        description: "Each row is one period you teach today: the subject, then branch · section · period number, and on the right the time and room.",
      },
      {
        element: tourTarget("take-attendance"),
        title: "Take attendance",
        description: "This button appears for the first 10 minutes of a class and opens Attendance with that class already picked. Once it's saved it changes to “✓ Attendance taken”.",
        optional: true,
      },
      {
        element: tourTarget("recent-activity"),
        title: "Recent Activity",
        description: "Things you've recently done, newest first. The coloured tag says what kind of change it was — CREATE (added), UPDATE (edited) or DELETE (removed) — with how long ago it happened.",
      },
    ],
  },
  {
    path: "/teachers/students",
    intro: { title: "Students", description: "Browse students branch by branch: pick a branch, then a year, then a section." },
    steps: [
      {
        element: tourTarget("branch-list"),
        title: "Pick a branch",
        description: "Each card is one branch — its short code and full name. Click one to choose a year next.",
      },
    ],
  },
  {
    path: "/teachers/students/[branch]",
    intro: { title: "Select Year", description: "Choose which year of this branch you want to see." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("year-list"),
        title: "Years",
        description: "1st to 4th year, with the semesters each one covers. Click one to see its sections.",
      },
    ],
  },
  {
    path: "/teachers/students/[branch]/[year]",
    intro: { title: "Select Section", description: "Choose a section to see its list of students." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("section-list"),
        title: "Sections",
        description: "One card per section. Click a section to open its student list.",
      },
    ],
  },
  {
    path: "/teachers/students/[branch]/[year]/[section]",
    intro: { title: "Student List", description: "Everyone enrolled in this section." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("student-table"),
        title: "Students",
        description: "# is just the row number, Roll No is the student's roll number (also their login), then their name. The total is shown at the bottom.",
      },
    ],
  },
  {
    path: "/teachers/attendance",
    intro: { title: "Attendance", description: "Mark who was present in a class. Today's date is shown at the top." },
    steps: [
      {
        element: tourTarget("class-picker"),
        title: "Select Class",
        description: "Pick the Branch, then Year, then Section — only the classes assigned to you are listed. Date is today by default; change it to mark an earlier day.",
      },
      {
        element: tourTarget("attendance-list"),
        title: "Student list",
        description: "Everyone starts as Present. Flip a student's switch to mark them Absent (red). The count at the top updates as you go.",
        optional: true,
      },
      {
        element: tourTarget("attendance-bulk"),
        title: "All Present / All Absent",
        description: "Set the whole class at once, then flip just the few who are different.",
        optional: true,
      },
      {
        element: tourTarget("attendance-submit"),
        title: "Save it",
        description: "Pick the subject if you teach more than one, then click Submit. “✓ Saved” means it's recorded and students can see it.",
        optional: true,
      },
    ],
  },
  {
    path: "/teachers/timetable",
    intro: { title: "Timetable", description: "Your weekly teaching schedule, as set up by the admin." },
    steps: [
      {
        element: tourTarget("timetable-day"),
        title: "One card per day",
        description: "Each row is a class you teach: the subject, then branch · year · section, and on the right the time and room.",
        optional: true,
      },
    ],
  },
  {
    path: "/teachers/assignments",
    intro: { title: "Assignments", description: "Tests and assignments you've set for your classes. Students see them in their portal with the date." },
    steps: [
      {
        element: tourTarget("create-assignment"),
        title: "Create",
        description: "Opens a form: choose Test or Assignment, give it a title and subject, pick the branch and year, set the due date and max marks, and optionally attach a file.",
      },
      {
        element: tourTarget("assignment-list"),
        title: "Your list",
        description: "Each row shows the title, whether it's a Test or Assignment, the subject, branch and year, any attached file, and on the right the due date, time and marks.",
        optional: true,
      },
    ],
  },
  {
    path: "/teachers/notices",
    intro: { title: "Notices", description: "College-wide notices, plus any you've posted yourself." },
    steps: [
      {
        element: tourTarget("post-notice"),
        title: "Post Notice",
        description: "Write a title and message, then choose who sees it: Students, Teachers Only, or both. For students you can narrow it to one branch and year.",
      },
      {
        element: tourTarget("notice-list"),
        title: "Notices",
        description: "Newest first. Tags show if a notice is Pinned, for Teachers Only, or aimed at one branch/year; the date is on the right.",
        optional: true,
      },
    ],
  },
  {
    path: "/teachers/queries",
    intro: { title: "Queries", description: "Questions from your students, and your own questions to the admin office." },
    steps: [
      {
        element: tourTarget("received-queries"),
        title: "Received from Students",
        description: "Each query shows who sent it and when. Type a reply and click Resolve to answer it (a reply is needed), or Close to shut it without replying. Reopen brings it back.",
      },
      {
        element: tourTarget("admin-query-form"),
        title: "New Query to Admin",
        description: "Need something from the admin office? Add a subject and message, then click Send Query.",
      },
      {
        element: tourTarget("sent-queries"),
        title: "Your Queries to Admin",
        description: "Everything you've sent the admin. Open = waiting, Resolved = answered (the reply is shown), Closed = shut without a reply.",
      },
    ],
  },
  {
    path: "/teachers/forums",
    intro: { title: "Forums", description: "Student group chats. You can join any of them as a moderator." },
    steps: [
      {
        element: tourTarget("forum-list"),
        title: "Forum list",
        description: "All the forums, with message counts and the latest message. Click one to open it.",
      },
      {
        element: tourTarget("forum-chat"),
        title: "Chat",
        description: "Read and reply here. As a moderator you can delete any message that breaks the rules (hover over it to see the delete button), or the whole forum with the bin icon at the top.",
      },
    ],
  },
  {
    path: "/teachers/messages",
    intro: { title: "Messages", description: "Private chat with the admin and other teachers. Students can't see this." },
    steps: [
      {
        element: tourTarget("message-list"),
        title: "Conversations",
        description: "Your chats, including the “All Staff” group. An orange dot means there's something you haven't read yet.",
      },
      {
        element: tourTarget("message-new"),
        title: "New conversation",
        description: "Click New and search for a staff member by name to start a one-to-one chat.",
      },
      {
        element: tourTarget("message-chat"),
        title: "Chat",
        description: "The open conversation's messages appear here, with a box at the bottom to write yours.",
      },
    ],
  },
  {
    path: "/teachers/resources",
    intro: { title: "Resources", description: "Share notes, PDFs and other study material with your students." },
    steps: [
      {
        element: tourTarget("upload-resource"),
        title: "Upload",
        description: "Give the file a title, pick the subject, branch and year it's for, then choose the file. Those students will see it in their Resources page.",
      },
      {
        element: tourTarget("resource-list"),
        title: "Your uploads",
        description: "Each file shows its title, subject, branch, year and upload date. Click it to open, or use the bin icon to delete it.",
        optional: true,
      },
    ],
  },
  {
    path: "/teachers/settings",
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
