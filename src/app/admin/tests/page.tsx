import Breadcrumb from "@/components/shared/Breadcrumb";
import ScheduleTestsPanel from "@/components/admin/FeaturePanels/ScheduleTestsPanel";

export default function ScheduleTestsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Schedule Tests" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Tests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create, edit and manage scheduled tests for each branch and year.
        </p>
      </div>
      <ScheduleTestsPanel />
    </div>
  );
}
