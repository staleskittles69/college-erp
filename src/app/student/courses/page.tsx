"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface TimetableRow { slots: { subject: string }[]; }

const COLORS = [
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];

export default function CoursesPage() {
  const { data: rows, loading } = useFetch<TimetableRow[]>("/api/timetable", []);

  const subjects = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((day) =>
      day.slots?.forEach((slot) => {
        if (slot.subject) seen.add(slot.subject);
      })
    );
    return [...seen].sort();
  }, [rows]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Courses" subtitle="Your enrolled courses this semester." />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-gray-100 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={30} />}
          iconClassName="bg-orange-50 text-orange-500"
          title="No courses yet"
          subtitle="Your courses will appear once your timetable is set up."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, colorIdx) => (
            <div
              key={subject}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${COLORS[colorIdx % COLORS.length]}`}>
                <BookOpen size={18} />
              </div>
              <p className="font-semibold text-gray-800">{subject}</p>
              <p className="text-xs text-gray-400 mt-1">This semester</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
