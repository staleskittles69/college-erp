"use client";

import { CalendarDays } from "lucide-react";
import { DAYS, PERIODS, PERIOD_TIMES } from "@/lib/academics";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface Slot {
  subject: string;
  period: number;
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
  const hasClasses = rows.some((row) => row.slots?.length > 0);
  // Mon–Fri always show; Saturday only when it has classes.
  const visibleDays = [0, 1, 2, 3, 4, 5].filter((day) => day < 5 || byDay[day]?.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Timetable" subtitle="Your weekly class schedule." />

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-4 animate-pulse space-y-3">
          {[...Array(6)].map((_, skeletonIdx) => (
            <div key={skeletonIdx} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : !hasClasses ? (
        <EmptyState
          icon={<CalendarDays size={30} />}
          iconClassName="bg-cyan-50 text-cyan-500"
          title="No timetable set"
          subtitle="Your schedule will appear once admin sets up your timetable."
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto" data-tour="timetable-day">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-orange-50 text-orange-800">
                <th className="w-28 px-4 py-3 text-left font-semibold border-b border-r border-orange-100">Day</th>
                {PERIODS.map((period) => (
                  <th key={period} className="px-3 py-3 text-center font-semibold border-b border-r border-orange-100 last:border-r-0">
                    <span className="block">Period {period}</span>
                    <span className="block text-[11px] font-normal text-orange-600 mt-0.5">{PERIOD_TIMES[period]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDays.map((day) => (
                <tr key={day} className="border-b border-gray-100 last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-r border-gray-100">
                    {DAYS[day]}
                  </th>
                  {PERIODS.map((period) => {
                    const slots = (byDay[day] ?? []).filter((slot) => slot.period === period);
                    return (
                      <td key={period} className="px-3 py-3 text-center align-middle border-r border-gray-100 last:border-r-0">
                        {slots.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          slots.map((slot, slotIdx) => (
                            <div key={slotIdx}>
                              <p className="font-semibold text-gray-800">{slot.subject}</p>
                              {slot.room && <p className="text-xs text-gray-400 mt-0.5">{slot.room}</p>}
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
