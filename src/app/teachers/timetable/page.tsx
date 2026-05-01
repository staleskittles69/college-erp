"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Slot { subject: string; time: string; room: string; }
interface TimetableRow { _id: string; branch: string; semester: number; section: string; dayOfWeek: number; slots: Slot[]; }

export default function TimetablePage() {
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/timetable", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const byDay = rows.reduce<Record<number, TimetableRow[]>>((acc, row) => {
    (acc[row.dayOfWeek] ??= []).push(row);
    return acc;
  }, {});
  const activeDays = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Timetable</h1>
        <p className="text-blue-200 text-sm mt-1">Your weekly teaching schedule</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}
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
                {byDay[day].flatMap((row) =>
                  row.slots.map((slot, si) => (
                    <div key={`${row._id}-${si}`} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{slot.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.branch} · Year {row.semester} · {row.section}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-600">{slot.time}</p>
                        <p className="text-xs text-gray-400">{slot.room}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
