"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";

interface AttendanceRecord {
  _id: string;
  subject: string;
  date: string;
  status: "present" | "absent";
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
}

function CircularProgress({ present, total, subject }: { present: number; total: number; subject: string }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const bg = pct >= 75 ? "#f0fdf4" : pct >= 50 ? "#fffbeb" : "#fef2f2";
  const badge = pct >= 75 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="relative" style={{ width: 100, height: 100, background: bg, borderRadius: "50%" }}>
        <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800 leading-tight">{subject || "General"}</p>
        <p className="text-xs text-gray-400 mt-0.5">{present}/{total} classes</p>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge}`}>{pct}%</span>
    </div>
  );
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const total = records.length;
  const present = records.filter((record) => record.status === "present").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const bySubject: Record<string, { present: number; total: number }> = {};
  records.forEach((record) => {
    const key = record.subject || "General";
    if (!bySubject[key]) bySubject[key] = { present: 0, total: 0 };
    bySubject[key].total += 1;
    if (record.status === "present") bySubject[key].present += 1;
  });

  const lowSubjects = Object.entries(bySubject).filter(
    ([, { present: presentCount, total: totalCount }]) => Math.round((presentCount / totalCount) * 100) < 75
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-white/80 text-sm mt-1">Monitor your attendance records and statistics.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 animate-pulse space-y-3">
          {[1, 2, 3].map((skeletonIdx) => <div key={skeletonIdx} className="h-10 bg-gray-100 rounded" />)}
        </div>
      ) : total === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
            <CalendarCheck size={30} className="text-green-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No attendance records</p>
            <p className="text-sm text-gray-400 mt-1">Your records will appear here once marked by the teacher.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overall summary strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Present", value: present, color: "bg-green-50 text-green-700" },
              { label: "Absent", value: total - present, color: "bg-red-50 text-red-700" },
              { label: "Overall", value: `${pct}%`, color: pct >= 75 ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium mt-0.5 opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Warning */}
          {lowSubjects.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">Attendance Warning</p>
              <ul className="space-y-1">
                {lowSubjects.map(([subject, { present: presentCount, total: totalCount }]) => {
                  const subPct = Math.round((presentCount / totalCount) * 100);
                  const needed = Math.ceil(totalCount * 0.75 - presentCount);
                  return (
                    <li key={subject} className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span>
                        <strong>{subject}</strong>: {subPct}% — attend {needed} more class{needed !== 1 ? "es" : ""} to reach 75%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Circular graphs per subject */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">Subject-wise Attendance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(bySubject).map(([subject, { present: presentCount, total: totalCount }]) => (
                <CircularProgress key={subject} subject={subject} present={presentCount} total={totalCount} />
              ))}
            </div>
          </div>

          {/* Recent records */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Recent Records</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.slice(0, 20).map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{record.subject || "General"}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(record.date)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${record.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
