"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";

interface AttendanceRecord {
  _id: string;
  subject: string;
  date: string;
  status: "present" | "absent";
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function CircularProgress({ present, total, subject }: { present: number; total: number; subject: string }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const bg = pct >= 75 ? "#f0fdf4" : pct >= 50 ? "#fffbeb" : "#fef2f2";
  const badge = pct >= 75 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="relative" style={{ width: 100, height: 100, background: bg, borderRadius: "50%" }}>
        <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={r} fill="none"
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
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const bySubject: Record<string, { present: number; total: number }> = {};
  records.forEach((r) => {
    const key = r.subject || "General";
    if (!bySubject[key]) bySubject[key] = { present: 0, total: 0 };
    bySubject[key].total += 1;
    if (r.status === "present") bySubject[key].present += 1;
  });

  const lowSubjects = Object.entries(bySubject).filter(
    ([, { present: p, total: t }]) => Math.round((p / t) * 100) < 75
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-blue-200 text-sm mt-1">Monitor your attendance records and statistics.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
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
              { label: "Overall", value: `${pct}%`, color: pct >= 75 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Warning */}
          {lowSubjects.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">Attendance Warning</p>
              <ul className="space-y-1">
                {lowSubjects.map(([subject, { present: p, total: t }]) => {
                  const subPct = Math.round((p / t) * 100);
                  const needed = Math.ceil(t * 0.75 - p);
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
              {Object.entries(bySubject).map(([subject, { present: p, total: t }]) => (
                <CircularProgress key={subject} subject={subject} present={p} total={t} />
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
                {records.slice(0, 20).map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{r.subject || "General"}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(r.date)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${r.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
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
