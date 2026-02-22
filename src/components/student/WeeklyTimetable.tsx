"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
      <Card>
        <CardHeader>
          <CardTitle>Weekly timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const byDay = rows.reduce(
    (acc, r) => {
      acc[r.dayOfWeek] = r.slots;
      return acc;
    },
    {} as Record<number, Array<{ subject: string; time: string; room: string }>>
  );
  const maxSlots = Math.max(
    ...Object.values(byDay).map((s) => s.length),
    1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly timetable</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-gray-500">No timetable set.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 text-gray-600 w-16">Day</th>
                  {DAYS.slice(0, 6).map((d, i) => (
                    <th key={d} className="text-left p-2 text-gray-600">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxSlots }, (_, slotIdx) => (
                  <tr key={slotIdx} className="border-b border-gray-100">
                    <td className="p-2 text-gray-500 align-top">
                      Slot {slotIdx + 1}
                    </td>
                    {[0, 1, 2, 3, 4, 5].map((day) => {
                      const slots = byDay[day] ?? [];
                      const slot = slots[slotIdx];
                      return (
                        <td key={day} className="p-2 align-top">
                          {slot ? (
                            <div>
                              <div className="font-medium">{slot.subject}</div>
                              <div className="text-gray-500 text-xs">
                                {slot.time} · {slot.room}
                              </div>
                            </div>
                          ) : (
                            "—"
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
