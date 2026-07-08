"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

const COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];

export default function CoursesPage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timetable")
      .then((response) => response.json())
      .then((data: { slots: { subject: string }[] }[]) => {
        const seen = new Set<string>();
        data.forEach((day) =>
          day.slots?.forEach((slot) => {
            if (slot.subject) seen.add(slot.subject);
          })
        );
        setSubjects([...seen].sort());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <p className="text-blue-200 text-sm mt-1">Your enrolled courses this semester.</p>
      </div>

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
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
            <BookOpen size={30} className="text-blue-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No courses yet</p>
            <p className="text-sm text-gray-400 mt-1">Your courses will appear once your timetable is set up.</p>
          </div>
        </div>
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
