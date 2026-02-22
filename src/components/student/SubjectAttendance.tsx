"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface SubjectStat {
  subject: string;
  present: number;
  total: number;
  percent: number;
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
          if (!bySubject[r.subject]) {
            bySubject[r.subject] = { present: 0, total: 0 };
          }
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
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject-wise attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-gray-500">No attendance data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-2 pr-4">Subject</th>
                  <th className="pb-2 pr-4">Present</th>
                  <th className="pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.subject} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{s.subject}</td>
                    <td className="py-2 pr-4">
                      {s.present} / {s.total}
                    </td>
                    <td className="py-2">{s.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
