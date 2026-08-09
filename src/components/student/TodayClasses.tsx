"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DAYS } from "@/lib/academics";

const SUBJECT_COLORS = [
  "bg-orange-100 text-orange-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

interface Slot { subject: string; time: string; room: string; }
interface TimetableRow { dayOfWeek: number; slots: Slot[]; }

// dayOfWeek is stored Monday-first (0=Mon..5=Sat), matching src/lib/academics.ts DAYS.
function todayIndex(): number {
  const jsDay = new Date().getDay(); // JS Date: 0=Sun..6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function TodayClasses() {
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timetable", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Today&apos;s classes</CardTitle></CardHeader>
        <CardContent><div className="h-24 bg-gray-50 rounded-lg" /></CardContent>
      </Card>
    );
  }

  const today = todayIndex();
  const slots = rows.find((row) => row.dayOfWeek === today)?.slots ?? [];
  const todayLabel = DAYS[today];

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex items-center justify-between gap-4">
        <CardTitle>Today&apos;s classes{todayLabel ? ` · ${todayLabel}` : ""}</CardTitle>
        <Link href="/student/timetable" className="text-xs font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap">
          View full timetable →
        </Link>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes today.</p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot, slotIdx) => (
              <div
                key={slotIdx}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${SUBJECT_COLORS[slotIdx % SUBJECT_COLORS.length]}`}
              >
                <span className="font-semibold text-sm">{slot.subject}</span>
                <span className="text-xs opacity-70">{slot.time} · {slot.room}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
