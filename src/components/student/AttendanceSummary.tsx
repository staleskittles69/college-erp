"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export function AttendanceSummary() {
  const [percent, setPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance", { credentials: "include" })
      .then((res) => res.ok ? res.json() : [])
      .then((records: Array<{ status: string }>) => {
        const total = records.length;
        const present = records.filter((r) => r.status === "present").length;
        setPercent(total > 0 ? Math.round((present / total) * 100) : 0);
      })
      .catch(() => setPercent(0))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overall attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const color =
    percent !== null && percent >= 75
      ? "text-green-600"
      : percent !== null && percent >= 50
      ? "text-amber-600"
      : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${color}`}>
          {percent !== null ? `${percent}%` : "—"}
        </p>
        <p className="text-sm text-gray-500 mt-1">Across all subjects</p>
      </CardContent>
    </Card>
  );
}
