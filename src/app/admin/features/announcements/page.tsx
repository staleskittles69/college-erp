import Breadcrumb from "@/components/admin/Breadcrumb";
import AnnouncementsPanel from "@/components/admin/FeaturePanels/AnnouncementsPanel";

export default function AnnouncementsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Announcements" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Post and manage announcements for students and staff.
        </p>
      </div>
      <AnnouncementsPanel />
    </div>
  );
}
