import Breadcrumb from "@/components/admin/Breadcrumb";
import TimetablePanel from "@/components/admin/FeaturePanels/TimetablePanel";

export default function TimetablePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: "Timetable" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Load an existing timetable or build a new one, then save it to the database.
        </p>
      </div>
      <TimetablePanel />
    </div>
  );
}
