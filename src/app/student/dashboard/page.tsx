"use client";

import { AttendanceSummary } from "@/components/student/AttendanceSummary";
import { SubjectAttendance } from "@/components/student/SubjectAttendance";
import { WeeklyTimetable } from "@/components/student/WeeklyTimetable";
import { UpcomingTests } from "@/components/student/UpcomingTests";
import { NoticeBoard } from "@/components/student/NoticeBoard";

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

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-7 text-white shadow-lg">
        <p className="text-blue-200 text-sm font-medium mb-1">{getGreeting()} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, Student!</h1>
        <p className="text-blue-200 text-sm mt-1">Here&apos;s your academic overview for today.</p>
      </div>

      {/* Progress cards */}
      <div>
        <SectionHeader title="Your Progress" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <div className="animate-slide-up">
            <AttendanceSummary />
          </div>
          <div className="animate-slide-up-1">
            <SubjectAttendance />
          </div>
          <div className="md:col-span-2 lg:col-span-1 animate-slide-up-2">
            <UpcomingTests />
          </div>
        </div>
      </div>

      {/* Timetable */}
      <div>
        <SectionHeader title="Weekly Schedule" />
        <div className="mt-4 animate-slide-up">
          <WeeklyTimetable />
        </div>
      </div>

      {/* Notices */}
      <div>
        <SectionHeader title="Notice Board" />
        <div className="mt-4 animate-slide-up">
          <NoticeBoard />
        </div>
      </div>

    </div>
  );
}
