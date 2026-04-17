import Breadcrumb from "@/components/admin/Breadcrumb";

const AUDIT_LOGS = [
  { id: 1, action: "Edited timetable (CSE Section A)", time: "2 hours ago" },
  { id: 2, action: "Added announcement (All Students)", time: "Yesterday" },
  { id: 3, action: "Updated marks (Rahul Sharma)", time: "3 days ago" },
  { id: 4, action: "Added new student (CS009)", time: "3 days ago" },
  { id: 5, action: "Deleted announcement (Sports Day)", time: "4 days ago" },
  { id: 6, action: "Edited timetable (ECE Section B)", time: "5 days ago" },
  { id: 7, action: "Marked attendance (MECH 2nd Year)", time: "6 days ago" },
  { id: 8, action: "Posted announcement (CSE)", time: "7 days ago" },
];

export default function AuditLogsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Audit Logs" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Recent admin actions from the last 7 days.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {AUDIT_LOGS.map((log) => (
            <div
              key={log.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm text-gray-700">{log.action}</p>
              <p className="text-xs text-gray-400 flex-shrink-0 ml-6">{log.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
