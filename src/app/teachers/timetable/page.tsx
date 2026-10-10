"use client";

import { CalendarDays } from "lucide-react";
import { DAYS as DAY_NAMES, PERIODS, PERIOD_TIMES } from "@/lib/academics";
import { useFetch } from "@/hooks/useFetch";

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
  const { data, loading, error } = useFetch<{ classes: ClassEntry[] }>("/api/teachers/me/timetable", { classes: [] });
  const classes = data.classes;

  const byDay = classes.reduce<Record<number, ClassEntry[]>>((acc, cls) => {
    (acc[cls.dayOfWeek] ??= []).push(cls);
    return acc;
  }, {});
  // Mon–Fri always show; Saturday only when it has classes.
  const visibleDays = [0, 1, 2, 3, 4, 5].filter((day) => day < 5 || byDay[day]?.length > 0);

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
      ) : classes.length === 0 ? (
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
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto" data-tour="timetable-day">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="w-28 px-4 py-3 text-left font-semibold border-b border-r border-gray-100">Day</th>
                {PERIODS.map((period) => (
                  <th key={period} className="px-3 py-3 text-center font-semibold border-b border-r border-gray-100 last:border-r-0">
                    <span className="block">Period {period}</span>
                    <span className="block text-[11px] font-normal text-gray-400 mt-0.5">{PERIOD_TIMES[period]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDays.map((day) => (
                <tr key={day} className="border-b border-gray-100 last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-r border-gray-100">
                    {DAY_NAMES[day]}
                  </th>
                  {PERIODS.map((period) => {
                    const entries = (byDay[day] ?? []).filter((cls) => cls.period === period);
                    return (
                      <td key={period} className="px-3 py-3 text-center align-middle border-r border-gray-100 last:border-r-0">
                        {entries.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          entries.map((cls, clsIdx) => (
                            <div key={clsIdx} className={clsIdx > 0 ? "mt-2 pt-2 border-t border-gray-100" : ""}>
                              <p className="font-semibold text-gray-800">{cls.subject}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{cls.branch} · Yr {cls.semester} · {cls.section}</p>
                              {cls.room && <p className="text-xs text-gray-400">{cls.room}</p>}
                            </div>
                          ))
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
