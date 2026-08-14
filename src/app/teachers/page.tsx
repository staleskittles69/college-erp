"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardList, Bell, CalendarDays, Clock } from "lucide-react";

interface TeacherStats {
  studentCount: number;
  sectionCount: number;
  classCount: number;
}

interface ScheduledClass {
  subject: string;
  period: number;
  time: string;
  room: string;
  branch: string;
  section: string;
}

interface ActivityEntry {
  _id: string;
  action: "create" | "update" | "delete";
  entityType: string;
  description: string;
  createdAt: string;
}

const ACTION_COLOR: Record<ActivityEntry["action"], string> = {
  create: "bg-green-50 text-green-600",
  update: "bg-blue-50 text-blue-600",
  delete: "bg-red-50 text-red-600",
};

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full bg-orange-600" />
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [noticeCount, setNoticeCount] = useState<number | null>(null);
  const [classes, setClasses] = useState<ScheduledClass[] | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/teachers/me/stats", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((statsData) => { if (statsData) setStats(statsData); })
      .catch(() => {});

    fetch("/api/notices?limit=100", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: unknown[]) => setNoticeCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setNoticeCount(0));

    fetch("/api/teachers/me/schedule", { credentials: "include" })
      .then((response) => response.ok ? response.json() : { classes: [] })
      .then((data: { classes: ScheduledClass[] }) => setClasses(data.classes ?? []))
      .catch(() => setClasses([]));

    fetch("/api/teachers/me/activity", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: ActivityEntry[]) => setActivity(Array.isArray(data) ? data : []))
      .catch(() => setActivity([]));
  }, []);

  const statCards = [
    { label: "Total Students",     value: stats ? String(stats.studentCount) : "—",   icon: Users,         color: "bg-orange-50 text-orange-600" },
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
          {classes === null ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-10 min-h-[200px] animate-pulse" />
          ) : classes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <CalendarDays size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">No classes scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Your timetable for today will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 min-h-[200px] space-y-2">
              {classes.map((cls, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg px-3 py-2 bg-orange-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{cls.subject}</p>
                    <p className="text-xs text-gray-500">{cls.branch} · {cls.section} · Period {cls.period}</p>
                  </div>
                  <span className="text-xs text-gray-500 text-right">{cls.time}{cls.room ? ` · ${cls.room}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeader title="Recent Activity" />
          {activity === null ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-10 min-h-[200px] animate-pulse" />
          ) : activity.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Clock size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Submissions and updates will show here.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 min-h-[200px] space-y-2">
              {activity.map((entry) => (
                <div key={entry._id} className="flex items-start gap-3 rounded-lg px-3 py-2">
                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ACTION_COLOR[entry.action]}`}>
                    {entry.action}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{entry.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
