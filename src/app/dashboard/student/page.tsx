import { AttendanceSummary } from "@/components/student/AttendanceSummary";
import { SubjectAttendance } from "@/components/student/SubjectAttendance";
import { WeeklyTimetable } from "@/components/student/WeeklyTimetable";
import { UpcomingTests } from "@/components/student/UpcomingTests";
import { NoticeBoard } from "@/components/student/NoticeBoard";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>

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
