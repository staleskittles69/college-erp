"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

interface TimetableRow {
  _id: string;
  dayOfWeek: number;
  slots: Array<{ subject: string; time: string; room: string }>;
}

export function WeeklyTimetable() {
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timetable", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Weekly timetable</CardTitle></CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-50 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const byDay = rows.reduce(
    (acc, r) => { acc[r.dayOfWeek] = r.slots; return acc; },
    {} as Record<number, Array<{ subject: string; time: string; room: string }>>
  );

  // Build unique subject → color map
  const allSubjects = Array.from(
    new Set(rows.flatMap((r) => r.slots.map((s) => s.subject)))
  );
  const subjectColor: Record<string, string> = {};
  allSubjects.forEach((s, i) => {
    subjectColor[s] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
  });

  const maxSlots = Math.max(...Object.values(byDay).map((s) => s.length), 1);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Weekly timetable</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-gray-500 text-sm">No timetable set.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 w-16 rounded-tl-lg" />
                  {DAYS.map((d) => (
                    <th key={d} className="text-left p-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 last:rounded-tr-lg">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxSlots }, (_, slotIdx) => (
                  <tr key={slotIdx} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-2.5 text-xs font-medium text-gray-400 align-top whitespace-nowrap">
                      Slot {slotIdx + 1}
                    </td>
                    {[0, 1, 2, 3, 4, 5].map((day) => {
                      const slot = (byDay[day] ?? [])[slotIdx];
                      return (
                        <td key={day} className="p-2.5 align-top">
                          {slot ? (
                            <div className={`inline-flex flex-col rounded-lg px-2.5 py-1.5 ${subjectColor[slot.subject] ?? "bg-gray-100 text-gray-700"}`}>
                              <span className="font-semibold text-xs leading-snug">{slot.subject}</span>
                              <span className="text-xs opacity-70 leading-snug">{slot.time} · {slot.room}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
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
      </CardContent>
    </Card>
  );
}
