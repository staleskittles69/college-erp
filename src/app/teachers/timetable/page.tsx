"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { DAYS as DAY_NAMES } from "@/lib/academics";

interface ClassEntry {
  subject: string;
  period: number;
  time: string;
  room: string;
  branch: string;
  semester: number;
  section: string;
  dayOfWeek: number;
}

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/teachers/me/timetable", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { classes: ClassEntry[] }) => setClasses(data.classes ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const byDay = classes.reduce<Record<number, ClassEntry[]>>((acc, cls) => {
    (acc[cls.dayOfWeek] ??= []).push(cls);
    return acc;
  }, {});
  const activeDays = Object.keys(byDay).map(Number).sort((dayA, dayB) => dayA - dayB);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Timetable</h1>
        <p className="text-white/80 text-sm mt-1">Your weekly teaching schedule</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 animate-pulse space-y-4">
          {[1, 2, 3].map((skeletonIdx) => <div key={skeletonIdx} className="h-16 bg-gray-100 rounded" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Could not load timetable.
        </div>
      ) : activeDays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 flex flex-col items-center justify-center gap-4 min-h-[300px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <CalendarDays size={26} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-600">No timetable assigned</p>
            <p className="text-sm text-gray-400 mt-1">Your schedule will appear here once the admin sets it up.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDays.map((day) => (
            <div key={day} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">{DAY_NAMES[day]}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {byDay[day]
                  .slice()
                  .sort((a, b) => a.period - b.period)
                  .map((cls, clsIdx) => (
                    <div key={`${day}-${clsIdx}`} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{cls.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cls.branch} · Year {cls.semester} · {cls.section}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-600">{cls.time}</p>
                        <p className="text-xs text-gray-400">{cls.room}</p>
                      </div>
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
