import { AttendanceSummary } from "@/components/student/AttendanceSummary";
import { SubjectAttendance } from "@/components/student/SubjectAttendance";
import { WeeklyTimetable } from "@/components/student/WeeklyTimetable";
import { UpcomingTests } from "@/components/student/UpcomingTests";
import { NoticeBoard } from "@/components/student/NoticeBoard";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here&apos;s your academic overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AttendanceSummary />
        <SubjectAttendance />
        <div className="md:col-span-2 lg:col-span-1">
          <UpcomingTests />
        </div>
      </div>

      <WeeklyTimetable />

      <NoticeBoard />
    </div>
  );
}
