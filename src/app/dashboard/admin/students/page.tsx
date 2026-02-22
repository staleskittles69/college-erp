import { StudentTable } from "@/components/admin/StudentTable";

export default function AdminStudentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage students</h1>
      <StudentTable />
    </div>
  );
}
