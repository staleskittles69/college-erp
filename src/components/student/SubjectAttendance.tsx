"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface SubjectStat {
  subject: string;
  present: number;
  total: number;
  percent: number;
}

function percentBadge(p: number) {
  if (p >= 75) return "bg-green-100 text-green-700";
  if (p >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function barGradient(p: number) {
  if (p >= 75) return "from-blue-500 to-sky-400";
  if (p >= 50) return "from-amber-500 to-yellow-400";
  return "from-red-500 to-rose-400";
}

export function SubjectAttendance() {
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((records: Array<{ subject: string; status: string }>) => {
        const bySubject: Record<string, { present: number; total: number }> = {};
        records.forEach((r) => {
          if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, total: 0 };
          bySubject[r.subject].total += 1;
          if (r.status === "present") bySubject[r.subject].present += 1;
        });
        setStats(
          Object.entries(bySubject).map(([subject, { present, total }]) => ({
            subject,
            present,
            total,
            percent: total > 0 ? Math.round((present / total) * 100) : 0,
          }))
        );
      })
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><CardTitle>Subject-wise attendance</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Subject-wise attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-gray-500 text-sm">No attendance data yet.</p>
        ) : (
          <div className="space-y-4">
            {stats.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-800 truncate">{s.subject}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-gray-400">{s.present}/{s.total}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${percentBadge(s.percent)}`}>
                      {s.percent}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${barGradient(s.percent)} transition-all duration-700`}
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
