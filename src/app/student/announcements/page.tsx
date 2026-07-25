import { Bell } from "lucide-react";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-white/80 text-sm mt-1">Stay updated with college notices and announcements.</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Bell size={30} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">No announcements</p>
          <p className="text-sm text-gray-400 mt-1">College announcements and notices will appear here.</p>
        </div>
      </div>
    </div>
  );
}
