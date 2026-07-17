"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { GraduationCap } from "lucide-react";
import { computeCGPA } from "@/lib/grades";

interface MarkRecord {
  subject: string;
  obtained: number;
  max: number;
}

export function CGPA() {
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/marks", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((records: MarkRecord[]) => {
        const uniqueSubjects = new Set(records.map((record) => record.subject));
        setSubjectCount(uniqueSubjects.size);
        setCgpa(computeCGPA(records));
      })
      .catch(() => setCgpa(null))
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

  if (cgpa === null) {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 mb-4">
            <GraduationCap size={22} className="text-gray-400" />
          </div>
          <p className="text-4xl font-bold text-gray-300 mb-0.5">—</p>
          <p className="text-sm font-medium text-gray-500 mb-4">Cumulative GPA</p>
          <p className="text-xs text-gray-400">No grades yet.</p>
        </CardContent>
      </Card>
    );
  }

  const colorClass = cgpa >= 8 ? "text-green-600" : cgpa >= 6 ? "text-amber-600" : "text-red-600";
  const iconBg     = cgpa >= 8 ? "bg-green-100"  : cgpa >= 6 ? "bg-amber-100"  : "bg-red-100";
  const barGradient = cgpa >= 8
    ? "from-green-500 to-emerald-400"
    : cgpa >= 6
    ? "from-amber-500 to-yellow-400"
    : "from-red-500 to-rose-400";
  const badge = cgpa >= 8 ? { label: "Excellent", cls: "bg-green-100 text-green-700" }
    : cgpa >= 6 ? { label: "Good Standing", cls: "bg-amber-100 text-amber-700" }
    : { label: "Needs Improvement", cls: "bg-red-100 text-red-700" };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            <GraduationCap size={22} className={colorClass} />
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <p className={`text-4xl font-bold ${colorClass} mb-0.5`}>{cgpa.toFixed(2)}</p>
        <p className="text-sm font-medium text-gray-500 mb-4">Cumulative GPA (out of 10)</p>

        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700`}
            style={{ width: `${(cgpa / 10) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Across {subjectCount} subject{subjectCount !== 1 ? "s" : ""}</p>
      </CardContent>
    </Card>
  );
}
