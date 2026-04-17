"use client";

import { Bell, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/student/dashboard':     'Dashboard',
  '/student/courses':       'Courses',
  '/student/assignments':   'Assignments',
  '/student/attendance':    'Attendance',
  '/student/grades':        'Grades',
  '/student/announcements': 'Announcements',
  '/student/timetable':     'Timetable',
  '/student/messages':      'Messages',
  '/student/resources':     'Resources',
  '/student/profile':       'Profile',
  '/student/settings':      'Settings',
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Student Portal';

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Page title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-blue-600" />
        <h1 className="text-base font-semibold text-gray-800">{pageTitle}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-blue-600" />
        </button>

        {/* Avatar / profile link */}
        <Link
          href="/student/profile"
          className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold hover:bg-blue-700 hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 transition-all ml-1"
          aria-label="Profile"
        >
          S
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
          aria-label="Logout"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
