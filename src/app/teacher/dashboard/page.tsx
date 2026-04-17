"use client";

import { Users, BookOpen, ClipboardList, Bell } from 'lucide-react';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full bg-blue-600" />
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const statCards = [
  { label: 'Total Students', value: '124', icon: Users,          color: 'bg-blue-50 text-blue-600' },
  { label: 'Classes Today',  value: '4',   icon: BookOpen,       color: 'bg-green-50 text-green-600' },
  { label: 'Pending Assignments', value: '3', icon: ClipboardList, color: 'bg-amber-50 text-amber-600' },
  { label: 'New Notices',    value: '2',   icon: Bell,           color: 'bg-purple-50 text-purple-600' },
];

const timetableToday = [
  { time: '09:00 AM', subject: 'Data Structures',    section: 'CS-A', room: '101' },
  { time: '11:00 AM', subject: 'Algorithms',         section: 'CS-B', room: '203' },
  { time: '01:00 PM', subject: 'Database Systems',   section: 'CS-A', room: '101' },
  { time: '03:00 PM', subject: 'Operating Systems',  section: 'IT-A', room: '302' },
];

const recentActivity = [
  { text: 'Marked attendance for CS-A (Data Structures)',   time: '9:45 AM' },
  { text: 'Posted assignment: Binary Trees Problem Set',    time: 'Yesterday' },
  { text: 'Uploaded notes for Database Systems',            time: 'Yesterday' },
  { text: 'Marked attendance for CS-B (Algorithms)',        time: '2 days ago' },
  { text: 'Graded Quiz 3 for CS-A',                         time: '2 days ago' },
];

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-7 text-white shadow-lg">
        <p className="text-blue-200 text-sm font-medium mb-1">{getGreeting()} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, Professor!</h1>
        <p className="text-blue-200 text-sm mt-1">Here&apos;s your teaching overview for today.</p>
      </div>

      {/* Stat cards */}
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

      {/* Timetable preview + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's timetable */}
        <div>
          <SectionHeader title="Today's Classes" />
          <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {timetableToday.map((cls, i) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i !== timetableToday.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-xs font-mono text-blue-600 w-20 shrink-0">{cls.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{cls.subject}</p>
                  <p className="text-xs text-gray-400">{cls.section} · Room {cls.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <SectionHeader title="Recent Activity" />
          <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {recentActivity.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${i !== recentActivity.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
