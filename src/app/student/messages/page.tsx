import { MessageSquare, Bell } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-white/80 text-sm mt-1">Direct conversations with your teachers.</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-10 flex flex-col items-center justify-center min-h-[300px] gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
          <MessageSquare size={30} className="text-violet-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">Messaging coming soon</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            Direct messaging with teachers is being built. In the meantime, check announcements for updates from your teachers.
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
