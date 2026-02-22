import { AttendanceForm } from "@/components/admin/AttendanceForm";

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
      <AttendanceForm />
    </div>
  );
}
