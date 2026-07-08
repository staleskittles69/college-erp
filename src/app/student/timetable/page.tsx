"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Slot {
  subject: string;
  time: string;
  room: string;
}

interface TimetableRow {
  dayOfWeek: number;
  slots: Slot[];
}

export default function TimetablePage() {
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timetable")
      .then((r) => r.json())
      .then((data: TimetableRow[]) => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  const byDay = Object.fromEntries(rows.map((r) => [r.dayOfWeek, r.slots]));
  const activeDays = [1, 2, 3, 4, 5, 6].filter((d) => byDay[d]?.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-blue-200 text-sm mt-1">Your weekly class schedule.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-gray-100 rounded-lg flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeDays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center">
            <CalendarDays size={30} className="text-cyan-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No timetable set</p>
            <p className="text-sm text-gray-400 mt-1">Your schedule will appear once admin sets up your timetable.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDays.map((day) => (
            <div key={day} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                <p className="font-semibold text-blue-800 text-sm">{DAYS[day]}</p>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byDay[day].map((slot, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">{slot.time}</p>
                    <p className="font-semibold text-gray-800 text-sm">{slot.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{slot.room}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
