// Content for the first-login walkthrough (see components/ui/ProductTour.tsx).
// All the wording lives here — edit or delete entries freely; steps whose target isn't on the
// page are skipped automatically, so nothing breaks if a menu item is renamed or removed.

export type TourRole = "admin" | "teacher" | "student";

export interface TourStep {
  /** CSS selector of the thing to highlight. Leave out for a centered popup with no highlight. */
  element?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface TourPlan {
  welcome: TourStep;
  sidebar: TourStep[];
  navbar: TourStep[];
}

/** The mobile-only step that points at the ☰ button (the sidebar is a slide-out drawer there). */
export const MOBILE_MENU_STEP: TourStep = {
  element: '[aria-label="Open menu"]',
  title: "Your menu",
  description: "Tap here to open the menu. Let's look inside.",
  side: "bottom",
  align: "start",
};

const navLink = (href: string) => `aside a[href="${href}"]`;

const BELL_STEP: TourStep = {
  element: 'button[aria-label="Notifications"]',
  title: "Notifications",
  description: "New replies, messages and forum mentions show up here, so you don't miss anything.",
  side: "bottom",
  align: "end",
};

const LOGOUT_STEP: TourStep = {
  element: 'button[aria-label="Logout"]',
  title: "Logout",
  description: "Click here when you're done. Always log out on a shared computer.",
  side: "bottom",
  align: "end",
};

const HELP_STEP: TourStep = {
  element: 'button[aria-label="Take a tour"]',
  title: "Need this again?",
  description: "Click this ? button any time to replay the tour.",
  side: "bottom",
  align: "end",
};

const REPLAY_HINT = "You can replay this tour any time with the ? button at the top.";

const STUDENT_PLAN: TourPlan = {
  welcome: {
    title: "Welcome to NRI University!",
    description: `Here's a quick tour of your student portal. ${REPLAY_HINT}`,
  },
  sidebar: [
    { element: navLink("/student"), title: "Dashboard", description: "Your home page: today's classes, upcoming tests and deadlines, and the latest notices at a glance." },
    { element: navLink("/student/courses"), title: "Courses", description: "The courses you're enrolled in this semester." },
    { element: navLink("/student/assignments"), title: "Assignments", description: "Your scheduled tests and assessments, with dates so you can plan ahead." },
    { element: navLink("/student/attendance"), title: "Attendance", description: "Your attendance record and percentage for each subject." },
    { element: navLink("/student/grades"), title: "Grades", description: "Your subject-wise marks and performance." },
    { element: navLink("/student/announcements"), title: "Announcements", description: "Notices and news from the college." },
    { element: navLink("/student/timetable"), title: "Timetable", description: "Your weekly class schedule." },
    { element: navLink("/student/messages"), title: "Queries", description: "Send a question to the admin office or a teacher, and track their reply here." },
    { element: navLink("/student/forums"), title: "Forums", description: "Chat with other students. Teachers may drop in to help." },
    { element: navLink("/student/resources"), title: "Resources", description: "Study materials and notes shared by your teachers." },
    { element: navLink("/student/profile"), title: "Profile", description: "Your personal, education and family details." },
    { element: navLink("/student/settings"), title: "Settings", description: "Change your password here." },
  ],
  navbar: [BELL_STEP, LOGOUT_STEP, HELP_STEP],
};

const TEACHER_PLAN: TourPlan = {
  welcome: {
    title: "Welcome to NRI University!",
    description: `Here's a quick tour of your teacher portal. ${REPLAY_HINT}`,
  },
  sidebar: [
    { element: navLink("/teachers"), title: "Dashboard", description: "Your home page: an overview and today's classes." },
    { element: navLink("/teachers/students"), title: "Students", description: "Pick a branch to browse students by year and section." },
    { element: navLink("/teachers/attendance"), title: "Attendance", description: "Mark attendance for the classes assigned to you." },
    { element: navLink("/teachers/timetable"), title: "Timetable", description: "Your teaching schedule, as set up by the admin." },
    { element: navLink("/teachers/assignments"), title: "Assignments", description: "Create assignments for your classes and attach files." },
    { element: navLink("/teachers/notices"), title: "Notices", description: "College-wide notices, and where you can post one for your class." },
    { element: navLink("/teachers/queries"), title: "Queries", description: "Questions from students, plus your own queries to the admin. A reply is needed to close a query." },
    { element: navLink("/teachers/forums"), title: "Forums", description: "Join any student forum as a moderator." },
    { element: navLink("/teachers/messages"), title: "Messages", description: "Chat directly with the admin and other teachers, or in the All Staff group." },
    { element: navLink("/teachers/resources"), title: "Resources", description: "Upload notes and study materials for your students." },
    { element: navLink("/teachers/settings"), title: "Settings", description: "Change your password here." },
  ],
  navbar: [BELL_STEP, LOGOUT_STEP, HELP_STEP],
};

const ADMIN_PLAN: TourPlan = {
  welcome: {
    title: "Welcome to the Admin Panel",
    description: `Here's a quick tour of what you can manage. ${REPLAY_HINT}`,
  },
  sidebar: [
    { element: navLink("/admin"), title: "Dashboard", description: "College-wide numbers at a glance, with a card for each branch." },
    { element: navLink("/admin/branches"), title: "Branches", description: "Add branches and drill down into years, sections and students." },
    { element: navLink("/admin/features/students"), title: "Students", description: "Browse, add and manage student records and their logins." },
    { element: navLink("/admin/teachers"), title: "Teachers", description: "Manage teachers by department, and assign them classes and subjects." },
    { element: navLink("/admin/tests"), title: "Schedule Tests", description: "Schedule tests and exams, including a run of consecutive exams like mid-terms." },
    { element: navLink("/admin/features/announcements"), title: "Announcements", description: "Post notices for students, teachers, or both." },
    { element: navLink("/admin/features/timetable"), title: "Timetable", description: "Set each class's weekly timetable." },
    { element: navLink("/admin/attendance"), title: "Attendance", description: "Pick a class, subject and date, then mark students present or absent." },
    { element: navLink("/admin/queries"), title: "Queries", description: "Questions sent to you by students and teachers. Reply to close them." },
    { element: navLink("/admin/forums"), title: "Forums", description: "Keep an eye on the student forums." },
    { element: navLink("/admin/messages"), title: "Messages", description: "Chat directly with teachers, or in the All Staff group." },
    { element: navLink("/admin/audit-logs"), title: "Audit Logs", description: "A record of who changed what in the system." },
    { element: navLink("/admin/settings"), title: "Settings", description: "Manage your admin account and change your password." },
  ],
  navbar: [
    {
      element: 'header input[placeholder^="Search"]',
      title: "Find any student",
      description: "Type a name or roll number to jump straight to that student's page.",
      side: "bottom",
      align: "start",
    },
    BELL_STEP,
    LOGOUT_STEP,
    HELP_STEP,
  ],
};

const PLANS: Record<TourRole, TourPlan> = {
  student: STUDENT_PLAN,
  teacher: TEACHER_PLAN,
  admin: ADMIN_PLAN,
};

export function getTourPlan(role: TourRole): TourPlan {
  return PLANS[role];
}
