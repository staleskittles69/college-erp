import Breadcrumb from "@/components/admin/Breadcrumb";
import { ClipboardList } from "lucide-react";

export default function AuditLogsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Audit Logs" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Admin action history.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <ClipboardList size={24} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-600">No logs recorded</p>
          <p className="text-sm text-gray-400 mt-1">Action logging is not yet enabled.</p>
        </div>
      </div>
    </div>
  );
}
