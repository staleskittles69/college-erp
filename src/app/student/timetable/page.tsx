"use client";

import { CalendarDays } from "lucide-react";
import { DAYS } from "@/lib/academics";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

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
  const { data: rows, loading } = useFetch<TimetableRow[]>("/api/timetable", []);

  const byDay = Object.fromEntries(rows.map((row) => [row.dayOfWeek, row.slots]));
  const activeDays = [0, 1, 2, 3, 4, 5].filter((day) => byDay[day]?.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Timetable" subtitle="Your weekly class schedule." />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-100 bg-white p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, slotSkeletonIdx) => (
                  <div key={slotSkeletonIdx} className="h-16 bg-gray-100 rounded-lg flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeDays.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={30} />}
          iconClassName="bg-cyan-50 text-cyan-500"
          title="No timetable set"
          subtitle="Your schedule will appear once admin sets up your timetable."
        />
      ) : (
        <div className="space-y-4">
          {activeDays.map((day) => (
            <div key={day} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
                <p className="font-semibold text-orange-800 text-sm">{DAYS[day]}</p>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byDay[day].map((slot, slotIdx) => (
                  <div key={slotIdx} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs text-orange-600 font-medium mb-1">{slot.time}</p>
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
