import Breadcrumb from "@/components/admin/Breadcrumb";
import StudentDataPanel from "@/components/admin/FeaturePanels/StudentDataPanel";

export default function StudentsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: "Students" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search for a student to view their full profile, marks, and attendance.
        </p>
      </div>
      <StudentDataPanel />
    </div>
  );
}
