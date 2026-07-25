import { Library, Bell } from "lucide-react";
import Link from "next/link";

export default function ResourcesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
        <p className="text-white/80 text-sm mt-1">Study materials and notes shared by teachers.</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-10 flex flex-col items-center justify-center min-h-[300px] gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Library size={30} className="text-emerald-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">Resources coming soon</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            Teachers will be able to upload notes, PDFs, and study materials here. Check announcements for shared links in the meantime.
          </p>
        </div>
        <Link
          href="/student/announcements"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          <Bell size={14} />
          View Announcements
        </Link>
      </div>
    </div>
  );
}
