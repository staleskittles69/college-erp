import Breadcrumb from "@/components/admin/Breadcrumb";
import TimetablePanel from "@/components/admin/FeaturePanels/TimetablePanel";

export default function TimetablePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: "Timetable" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure and manage class schedules for all sections.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap items-center gap-3">
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option>CSE</option>
          <option>ECE</option>
          <option>MECH</option>
          <option>CIVIL</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option>Section A</option>
          <option>Section B</option>
          <option>Section C</option>
        </select>
        <button className="ml-auto px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          Load Timetable
        </button>
      </div>

      <TimetablePanel />
    </div>
  );
}
