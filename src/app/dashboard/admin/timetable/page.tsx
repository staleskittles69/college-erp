import { TimetableForm } from "@/components/admin/TimetableForm";

export default function AdminTimetablePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
      <TimetableForm />
    </div>
  );
}
