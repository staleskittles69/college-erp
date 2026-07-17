"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { GRADE_COLORS, calcGrade } from "@/lib/grades";

interface MarkRecord {
  id: string;
  subject: string;
  examType: string;
  obtained: number;
  max: number;
}

export default function GradesPage() {
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/marks", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setMarks)
      .catch(() => setMarks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
        <p className="text-blue-200 text-sm mt-1">Your subject-wise marks and performance.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 animate-pulse space-y-3">
          {[1, 2, 3].map((skeletonIdx) => (
            <div key={skeletonIdx} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      ) : marks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <GraduationCap size={30} className="text-amber-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No grades yet</p>
            <p className="text-sm text-gray-400 mt-1">Your marks will appear here once the admin adds them.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marks.map((row) => {
                const grade = calcGrade(row.obtained, row.max);
                const pct = Math.round((row.obtained / row.max) * 100);
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800">{row.subject}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{row.examType}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-gray-800 font-medium">{row.obtained}</span>
                      <span className="text-gray-400">/{row.max}</span>
                      <span className="text-gray-400 text-xs ml-1">({pct}%)</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${GRADE_COLORS[grade] ?? "bg-gray-100 text-gray-600"}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {marks.length} record{marks.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
