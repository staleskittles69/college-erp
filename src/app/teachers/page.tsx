"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, Bell, CalendarDays, Clock } from "lucide-react";

interface TeacherStats {
  studentCount: number;
  sectionCount: number;
  classCount: number;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full bg-blue-600" />
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [noticeCount, setNoticeCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/teachers/me/stats", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});

    fetch("/api/notices?limit=100", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown[]) => setNoticeCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setNoticeCount(0));
  }, []);

  const statCards = [
    { label: "Total Students",     value: stats ? String(stats.studentCount) : "—",   icon: Users,         color: "bg-blue-50 text-blue-600" },
    { label: "Sections Assigned",  value: stats ? String(stats.sectionCount)  : "—",  icon: BookOpen,      color: "bg-green-50 text-green-600" },
    { label: "Pending Assignments", value: "—",                                        icon: ClipboardList, color: "bg-amber-50 text-amber-600" },
    { label: "Active Notices",     value: noticeCount !== null ? String(noticeCount) : "—", icon: Bell,    color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <SectionHeader title="Today's Classes" />
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <CalendarDays size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">No classes scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Your timetable for today will appear here.</p>
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="Recent Activity" />
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Clock size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Submissions and updates will show here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
