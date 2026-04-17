"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";

export function AttendanceSummary() {
  const [percent, setPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
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
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-12 w-12 rounded-xl bg-gray-100 mb-4" />
          <div className="h-8 w-24 bg-gray-100 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  const p = percent ?? 0;

  const colorClass = p >= 75 ? "text-green-600" : p >= 50 ? "text-amber-600" : "text-red-600";
  const iconBg     = p >= 75 ? "bg-green-100"  : p >= 50 ? "bg-amber-100"  : "bg-red-100";
  const iconColor  = p >= 75 ? "text-green-600" : p >= 50 ? "text-amber-600" : "text-red-600";
  const barGradient = p >= 75
    ? "from-green-500 to-emerald-400"
    : p >= 50
    ? "from-amber-500 to-yellow-400"
    : "from-red-500 to-rose-400";
  const badge = p >= 75 ? { label: "Good Standing", cls: "bg-green-100 text-green-700" }
    : p >= 50 ? { label: "Needs Attention", cls: "bg-amber-100 text-amber-700" }
    : { label: "Critical", cls: "bg-red-100 text-red-700" };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <CheckCircle2 size={22} className={iconColor} />
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <p className={`text-4xl font-bold ${colorClass} mb-0.5`}>{p}%</p>
        <p className="text-sm font-medium text-gray-500 mb-4">Overall Attendance</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700`}
            style={{ width: `${p}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Across all subjects</p>
      </CardContent>
    </Card>
  );
}
