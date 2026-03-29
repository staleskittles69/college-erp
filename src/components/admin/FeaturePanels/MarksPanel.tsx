const PLACEHOLDER_MARKS = [
  { roll: "CS001", name: "Rahul Sharma", subject: "Mathematics", obtained: 85, max: 100, grade: "A" },
  { roll: "CS002", name: "Priya Patel", subject: "Mathematics", obtained: 92, max: 100, grade: "A+" },
  { roll: "CS003", name: "Amit Kumar", subject: "Mathematics", obtained: 74, max: 100, grade: "B+" },
  { roll: "CS004", name: "Sneha Reddy", subject: "Mathematics", obtained: 61, max: 100, grade: "B" },
  { roll: "CS005", name: "Vikram Singh", subject: "Mathematics", obtained: 55, max: 100, grade: "C+" },
];

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  "A": "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  "B": "bg-blue-50 text-blue-600",
  "C+": "bg-yellow-100 text-yellow-700",
  "C": "bg-orange-100 text-orange-700",
};

interface MarksPanelProps {
  context?: string;
}

export default function MarksPanel({ context }: MarksPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">Marks Management</h3>
          {context && (
            <p className="text-xs text-gray-500 mt-0.5">{context}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option>Mathematics</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>English</option>
          </select>
          <button className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            + Add Marks
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PLACEHOLDER_MARKS.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">{row.roll}</td>
                <td className="px-6 py-3.5 font-medium text-gray-800">{row.name}</td>
                <td className="px-6 py-3.5 text-gray-600">{row.subject}</td>
                <td className="px-6 py-3.5">
                  <span className="text-gray-800 font-medium">{row.obtained}</span>
                  <span className="text-gray-400">/{row.max}</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${GRADE_COLORS[row.grade] ?? "bg-gray-100 text-gray-600"}`}>
                    {row.grade}
                  </span>
                </td>
                <td className="px-6 py-3.5 flex items-center gap-3">
                  <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                  <button className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">Showing {PLACEHOLDER_MARKS.length} records</span>
        <button className="text-xs text-indigo-600 hover:underline font-medium">Export CSV</button>
      </div>
    </div>
  );
}
