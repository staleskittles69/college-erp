import { TestForm } from "@/components/admin/TestForm";

export default function AdminTestsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
      <TestForm />
    </div>
  );
}
