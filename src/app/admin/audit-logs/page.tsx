import Breadcrumb from "@/components/admin/Breadcrumb";
import AuditLogPanel from "@/components/admin/FeaturePanels/AuditLogPanel";

export default function AuditLogsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Audit Logs" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every change admins and teachers make to student, teacher, and academic records.
        </p>
      </div>
      <AuditLogPanel />
    </div>
  );
}
