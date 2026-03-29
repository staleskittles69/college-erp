const PLACEHOLDER_ATTENDANCE = [
  { roll: "CS001", name: "Rahul Sharma", present: 42, total: 48, pct: 87 },
  { roll: "CS002", name: "Priya Patel", present: 46, total: 48, pct: 96 },
  { roll: "CS003", name: "Amit Kumar", present: 35, total: 48, pct: 73 },
  { roll: "CS004", name: "Sneha Reddy", present: 30, total: 48, pct: 63 },
  { roll: "CS005", name: "Vikram Singh", present: 44, total: 48, pct: 92 },
];

function pctColor(pct: number) {
  if (pct >= 85) return "text-emerald-600";
  if (pct >= 75) return "text-yellow-600";
  return "text-red-500";
}

function barColor(pct: number) {
  if (pct >= 85) return "bg-emerald-500";
  if (pct >= 75) return "bg-yellow-500";
  return "bg-red-500";
}

interface AttendancePanelProps {
  context?: string;
}

export default function AttendancePanel({ context }: AttendancePanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">Attendance Management</h3>
          {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100">
        {[
          { label: "Present Today", value: "4", color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent Today", value: "1", color: "text-red-600 bg-red-50" },
          { label: "Avg Attendance", value: "82%", color: "text-indigo-600 bg-indigo-50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg px-4 py-3 ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Classes</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Percentage</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PLACEHOLDER_ATTENDANCE.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">{row.roll}</td>
                <td className="px-6 py-3.5 font-medium text-gray-800">{row.name}</td>
                <td className="px-6 py-3.5 text-gray-700">{row.present}</td>
                <td className="px-6 py-3.5 text-gray-500">{row.total}</td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${barColor(row.pct)}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-10 ${pctColor(row.pct)}`}>{row.pct}%</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">
                    <option>Present</option>
                    <option>Absent</option>
                    <option>Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Showing {PLACEHOLDER_ATTENDANCE.length} students
        </span>
        <button className="text-xs text-indigo-600 hover:underline font-medium">Export Report</button>
      </div>
    </div>
  );
}
