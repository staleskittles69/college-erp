import Breadcrumb from "@/components/admin/Breadcrumb";
import StudentDataPanel from "@/components/admin/FeaturePanels/StudentDataPanel";

export default function StudentsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: "Students" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add, edit, and manage student records across all branches.
        </p>
      </div>
      <StudentDataPanel />
    </div>
  );
}
