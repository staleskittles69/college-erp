const PLACEHOLDER_STUDENTS = [
  { id: "stu-001", name: "Rahul Sharma", rollNo: "CS001", email: "rahul@college.edu", phone: "9876543210", status: "Active" },
  { id: "stu-002", name: "Priya Patel", rollNo: "CS002", email: "priya@college.edu", phone: "9876543211", status: "Active" },
  { id: "stu-003", name: "Amit Kumar", rollNo: "CS003", email: "amit@college.edu", phone: "9876543212", status: "Active" },
  { id: "stu-004", name: "Sneha Reddy", rollNo: "CS004", email: "sneha@college.edu", phone: "9876543213", status: "Inactive" },
  { id: "stu-005", name: "Vikram Singh", rollNo: "CS005", email: "vikram@college.edu", phone: "9876543214", status: "Active" },
];

interface StudentDataPanelProps {
  context?: string;
}

export default function StudentDataPanel({ context }: StudentDataPanelProps) {
  return (
    <div className="space-y-5">
      {/* Add Student Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Add New Student</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Roll Number</label>
            <input
              type="text"
              placeholder="e.g. CS001"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="student@college.edu"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600">
              <option>CSE</option>
              <option>ECE</option>
              <option>MECH</option>
              <option>CIVIL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600">
              <option>Section A</option>
              <option>Section B</option>
              <option>Section C</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          {context && <p className="text-xs text-gray-400">Context: {context}</p>}
          <div className="flex gap-2 ml-auto">
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Student Records</h3>
          <input
            type="text"
            placeholder="Search by name or roll no..."
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-56"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PLACEHOLDER_STUDENTS.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{s.rollNo}</td>
                  <td className="px-6 py-3.5 font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-3.5 text-gray-600">{s.email}</td>
                  <td className="px-6 py-3.5 text-gray-500">{s.phone}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        s.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status}
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
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {PLACEHOLDER_STUDENTS.length} students found
          </span>
          <button className="text-xs text-indigo-600 hover:underline font-medium">Export CSV</button>
        </div>
      </div>
    </div>
  );
}
