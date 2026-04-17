import { CalendarDays } from "lucide-react";

export default function TimetablePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-blue-200 text-sm mt-1">View your daily class schedule.</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center">
          <CalendarDays size={30} className="text-cyan-500" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">No timetable set</p>
          <p className="text-sm text-gray-400 mt-1">Your full weekly schedule will appear here.</p>
        </div>
      </div>
    </div>
  );
}
