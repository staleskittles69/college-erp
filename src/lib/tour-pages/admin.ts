// Per-page tours for the admin panel. The data-tour="…" markers these point at live in each page's JSX.
import type { PageTour, TourStep } from "../tour-steps";
import { BREADCRUMB, tourTarget } from "./shared";

const BREADCRUMB_STEP: TourStep = {
  element: BREADCRUMB,
  title: "Where you are",
  description: "This trail shows how you got here. Click any earlier part to go back up a level.",
};

const MARKS_STEPS: TourStep[] = [
  {
    element: tourTarget("marks-add"),
    title: "+ Add Marks",
    description: "Opens a small form: pick the subject and exam type (Mid Term, Final, Assignment, Quiz or Practical), enter the marks obtained and the maximum, then save.",
    optional: true,
  },
  {
    element: tourTarget("marks-summary"),
    title: "Marks summary",
    description: "Records = how many marks entries this student has. Subjects = how many different subjects. CGPA = their overall grade point out of 10.",
    optional: true,
  },
  {
    element: tourTarget("marks-table"),
    title: "Marks table",
    description: "One row per exam: subject, exam type, marks scored out of the maximum, and the letter grade. Delete removes an entry that was added by mistake.",
    optional: true,
  },
];

export const ADMIN_PAGES: PageTour[] = [
  {
    path: "/admin",
    intro: { title: "Dashboard", description: "College-wide numbers at a glance, plus shortcuts to common jobs." },
    steps: [
      {
        element: tourTarget("stat-students"),
        title: "Total Students",
        description: "Every student account in the system, across all branches and years.",
      },
      {
        element: tourTarget("stat-branches"),
        title: "Branches",
        description: "How many branches (departments like CSE or ECE) have been set up.",
      },
      {
        element: tourTarget("stat-notices"),
        title: "Active Notices",
        description: "How many announcements are currently posted.",
      },
      {
        element: tourTarget("stat-tests"),
        title: "Tests Scheduled",
        description: "How many tests and exams are scheduled in total.",
      },
      {
        element: tourTarget("branch-cards"),
        title: "Manage Students",
        description: "One card per branch with its student count. Click a card to drill into its years, sections and students. “View All” opens the Branches page.",
      },
      {
        element: tourTarget("quick-actions"),
        title: "Quick Actions",
        description: "Shortcuts to everyday jobs: manage marks, view attendance, post an announcement, edit a timetable, or find a student.",
      },
    ],
  },
  {
    path: "/admin/branches",
    intro: { title: "Branches", description: "The college's branches (departments). This is also where the student drill-down starts." },
    steps: [
      {
        element: tourTarget("add-branch"),
        title: "Add Branch",
        description: "Create a new branch with a short code (e.g. IT) and its full name. It then also appears under Teachers as a department.",
      },
      {
        element: tourTarget("branch-list"),
        title: "Your branches",
        description: "Each card shows the branch code, full name and how many sections it has. Click a card to pick a year. Hover over a card to show the bin icon for deleting it.",
        optional: true,
      },
    ],
  },
  {
    path: "/admin/[branch]",
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
    path: "/admin/[branch]/[year]",
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
    path: "/admin/[branch]/[year]/[section]",
    intro: { title: "Student List", description: "Everyone enrolled in this section." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("roll-search"),
        title: "Search by roll number",
        description: "Type part of a roll number to filter the list below.",
      },
      {
        element: tourTarget("student-table"),
        title: "Students",
        description: "# is the row number, then roll number and name. Click View on a row to open that student's marks, attendance and details.",
      },
    ],
  },
  {
    path: "/admin/[branch]/[year]/[section]/[studentId]",
    intro: { title: "Student Record", description: "Everything about one student: marks, attendance and personal details." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("student-info"),
        title: "Student",
        description: "Their name, roll number, and branch · year · section.",
      },
      {
        element: tourTarget("student-tabs"),
        title: "Tabs",
        description: "Marks = add or remove exam marks. Attendance = subject-wise attendance, and add a record by hand. Details = their login, personal, education, parent and guardian details, which you can edit.",
      },
      ...MARKS_STEPS,
    ],
  },
  {
    path: "/admin/features/students",
    intro: { title: "Student Management", description: "Find any student, or spot students who need help." },
    steps: [
      {
        element: tourTarget("student-panel-tabs"),
        title: "Three views",
        description: "Find a Student = search. Backlogs = students who scored under 40% in a subject. Low Attendance = students attending under 75% of classes. Each at-risk row has a button to open that student.",
      },
      {
        element: tourTarget("student-search"),
        title: "Find a Student",
        description: "Type a name or roll number. Matching students appear below with their branch, year and section — click one to open their record.",
        optional: true,
      },
    ],
  },
  {
    path: "/admin/teachers",
    intro: { title: "Teachers", description: "Teachers are organised by department, then by the subjects they teach." },
    steps: [
      {
        element: tourTarget("department-list"),
        title: "Departments",
        description: "One card per department with how many teachers it has. Click one to see its subjects. Departments come from your branches.",
        optional: true,
      },
    ],
  },
  {
    path: "/admin/teachers/[department]",
    intro: { title: "Department Subjects", description: "The subjects this department teaches, and who teaches them." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("add-subject"),
        title: "Add Subject",
        description: "Add a new subject to this department.",
      },
      {
        element: tourTarget("subject-search"),
        title: "Search subjects",
        description: "Type to filter the subject list below.",
      },
      {
        element: tourTarget("subject-list"),
        title: "Subjects",
        description: "Each subject shows how many teachers teach it. Click one to manage its teachers.",
      },
    ],
  },
  {
    path: "/admin/teachers/[department]/subjects/[subjectId]",
    intro: { title: "Subject Teachers", description: "Who teaches this subject." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("new-teacher"),
        title: "New Teacher",
        description: "Create a brand-new teacher account (with their login) for this subject.",
      },
      {
        element: tourTarget("assign-existing"),
        title: "Assign an existing teacher",
        description: "Already have the teacher in this department? Pick them from the list and click Assign.",
        optional: true,
      },
      {
        element: tourTarget("subject-teachers"),
        title: "Teachers",
        description: "Each teacher's name and email. Remove takes them off this subject only (their account stays). View Details opens their full profile.",
      },
    ],
  },
  {
    path: "/admin/teachers/[department]/[teacherId]",
    intro: { title: "Teacher Details", description: "One teacher's profile, login and classes." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("teacher-info"),
        title: "Teacher Info",
        description: "Their name, email and department.",
      },
      {
        element: tourTarget("teacher-actions"),
        title: "Actions",
        description: "Assign Class = give them a branch, year and sections to teach. Edit Timetable = set their weekly periods. Delete Teacher = remove their account completely.",
      },
      {
        element: tourTarget("teacher-login"),
        title: "Login Credentials",
        description: "Their login email (with a Copy button). Passwords are never shown — use “Set new password” if they've forgotten it, then tell them the new one.",
      },
      {
        element: tourTarget("teacher-classes"),
        title: "Assigned Classes",
        description: "Every class and section this teacher is assigned to. These decide what they see in Attendance and on their dashboard.",
      },
    ],
  },
  {
    path: "/admin/tests",
    intro: { title: "Schedule Tests", description: "Put tests and exams on the calendar. Students see them on their dashboard and Assignments page." },
    steps: [
      {
        element: tourTarget("test-mode"),
        title: "Single or Multiple",
        description: "Single Test = one test. Multiple Tests = a run of exams (like mid-terms) for one branch and year, entered together as a named series.",
      },
      {
        element: tourTarget("test-form"),
        title: "Test details",
        description: "Choose the branch, year, section, subject and type, then the date, time or period, and maximum marks. Click the button at the bottom to save.",
      },
      {
        element: tourTarget("test-series"),
        title: "Series",
        description: "Each series (e.g. Mid-Term 1) with how many tests it has. Delete here removes the whole series at once.",
        optional: true,
      },
      {
        element: tourTarget("test-list"),
        title: "Scheduled Tests",
        description: "Every scheduled test: title, branch, year, section, subject, date, time, marks and series. Use Edit to change one or Delete to remove it.",
      },
    ],
  },
  {
    path: "/admin/features/announcements",
    intro: { title: "Announcements", description: "Post notices that show up in the student and/or teacher portals." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("announcement-form"),
        title: "Post New Announcement",
        description: "Write a title and message, choose the audience (students, teachers or both), optionally narrow students to one branch or year, tick “Pin” to keep it at the top, then click Publish.",
      },
      {
        element: tourTarget("announcement-list"),
        title: "All Announcements",
        description: "Everything posted so far, newest first, with its date and who it's aimed at (📢). Delete takes it down for everyone.",
      },
    ],
  },
  {
    path: "/admin/features/timetable",
    intro: { title: "Timetable", description: "Set each class's weekly timetable. Students and teachers see it straight away." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("timetable-class"),
        title: "Pick the class",
        description: "Choose branch, year and section number. Changes save automatically — watch for “✓ Saved” here.",
      },
      {
        element: tourTarget("timetable-add"),
        title: "+ Add/Edit Slot",
        description: "Opens a form to choose a day, period and subject.",
      },
      {
        element: tourTarget("timetable-grid"),
        title: "The week",
        description: "Rows are days, columns are periods (with their times). Click an empty “+ Add” box to fill that period, or click a subject to change or delete it.",
      },
    ],
  },
  {
    path: "/admin/attendance",
    intro: { title: "Mark Attendance", description: "Record which students were present in a class." },
    steps: [
      {
        element: tourTarget("attendance-filters"),
        title: "Choose the class",
        description: "Pick branch, year and section, click Load Students, then choose the subject and date.",
      },
      {
        element: tourTarget("attendance-list"),
        title: "Student list",
        description: "Everyone starts as Present. Click a student's button to switch them to Absent, or use All Present / All Absent at the top.",
        optional: true,
      },
      {
        element: tourTarget("attendance-submit"),
        title: "Submit Attendance",
        description: "Saves it. “✓ Attendance saved” means students can now see it.",
        optional: true,
      },
    ],
  },
  {
    path: "/admin/features/attendance",
    intro: { title: "Attendance Management", description: "Look up the attendance recorded for one section on one day." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("attendance-filters"),
        title: "Filters",
        description: "Choose branch, year, section (e.g. “Section 1”) and date, then click Apply Filters.",
      },
      {
        element: tourTarget("attendance-summary"),
        title: "Summary",
        description: "Total Students in the section, how many were present in at least one class that day, and how many attendance records were found.",
        optional: true,
      },
    ],
  },
  {
    path: "/admin/features/marks",
    intro: { title: "Marks Management", description: "Find a student to view, add or remove their marks." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("marks-search"),
        title: "Search Student",
        description: "Type a name or roll number and pick the student from the dropdown. Their marks then appear below.",
      },
      ...MARKS_STEPS,
    ],
  },
  {
    path: "/admin/queries",
    intro: { title: "Queries", description: "Questions sent to the admin office by students and teachers." },
    steps: [
      {
        element: tourTarget("query-filters"),
        title: "Filter",
        description: "Open = waiting for you. Resolved = answered. Closed = shut without a reply. All = everything.",
      },
      {
        element: tourTarget("query-list"),
        title: "Queries",
        description: "Each query shows who sent it (student or teacher), who it's to, and when. Type a reply and click Resolve to answer it, or Close it without replying. Reopen brings it back.",
      },
    ],
  },
  {
    path: "/admin/forums",
    intro: { title: "Forums", description: "The student group chats. You can read, rename or delete any forum and remove any message." },
    steps: [
      {
        element: tourTarget("forum-list"),
        title: "Forum list",
        description: "All the forums, with message counts and the latest message. Click one to open it.",
      },
      {
        element: tourTarget("forum-chat"),
        title: "Chat",
        description: "The open forum's messages. Use the icons at the top to rename or delete the forum; hover over a message to delete it.",
      },
    ],
  },
  {
    path: "/admin/messages",
    intro: { title: "Messages", description: "Private chat with teachers. Students can't see this." },
    steps: [
      {
        element: tourTarget("message-list"),
        title: "Conversations",
        description: "Your chats, including the “All Staff” group. An orange dot means there's something you haven't read yet.",
      },
      {
        element: tourTarget("message-new"),
        title: "New conversation",
        description: "Click New and search for a teacher by name to start a one-to-one chat.",
      },
      {
        element: tourTarget("message-chat"),
        title: "Chat",
        description: "The open conversation's messages appear here, with a box at the bottom to write yours.",
      },
    ],
  },
  {
    path: "/admin/audit-logs",
    intro: { title: "Audit Logs", description: "A record of every change admins and teachers make to students, teachers and academic records." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("audit-range"),
        title: "Time range",
        description: "Show just the last 10 changes, or everything from the last 7, 30 or 90 days.",
      },
      {
        element: tourTarget("audit-refresh"),
        title: "Refresh",
        description: "Reload the list to pick up changes made since you opened the page.",
      },
      {
        element: tourTarget("audit-list"),
        title: "The log",
        description: "Each line: what kind of change (create, update or delete), what was changed, who did it (and whether they're an admin or teacher), and when. Logs older than 3 months are cleared automatically.",
      },
    ],
  },
  {
    path: "/admin/settings",
    intro: { title: "Settings", description: "Your admin account." },
    steps: [
      BREADCRUMB_STEP,
      {
        element: tourTarget("password-form"),
        title: "Password",
        description: "Change your own password: type the current one, then the new one twice.",
      },
    ],
  },
];
