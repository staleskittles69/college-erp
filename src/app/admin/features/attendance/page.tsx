import Breadcrumb from "@/components/admin/Breadcrumb";
import AttendancePanel from "@/components/admin/FeaturePanels/AttendancePanel";

export default function AttendancePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Attendance Management" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage student attendance records across all sections.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap items-center gap-3">
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Branches</option>
          <option>CSE</option>
          <option>ECE</option>
          <option>MECH</option>
          <option>CIVIL</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Years</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Sections</option>
          <option>Section A</option>
          <option>Section B</option>
          <option>Section C</option>
        </select>
        <input
          type="date"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button className="ml-auto px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          Apply Filters
        </button>
      </div>

      <AttendancePanel />
    </div>
  );
}
