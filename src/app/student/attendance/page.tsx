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

  // Group by subject
  const bySubject: Record<string, { present: number; total: number }> = {};
  records.forEach((r) => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, total: 0 };
    bySubject[r.subject].total += 1;
    if (r.status === "present") bySubject[r.subject].present += 1;
  });

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
            <p className="text-sm text-gray-400 mt-1">Your records will appear here once marked by the admin.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
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

          {/* Subject-wise */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Subject-wise Breakdown</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(bySubject).map(([subject, { present: p, total: t }]) => {
                const subPct = Math.round((p / t) * 100);
                const barColor = subPct >= 75 ? "from-green-500 to-emerald-400" : subPct >= 50 ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";
                const badge = subPct >= 75 ? "bg-green-100 text-green-700" : subPct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                return (
                  <div key={subject} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{subject}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{p}/{t} classes</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{subPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${subPct}%` }} />
                    </div>
                  </div>
                );
              })}
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
                    <td className="px-6 py-3 font-medium text-gray-800">{r.subject}</td>
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
