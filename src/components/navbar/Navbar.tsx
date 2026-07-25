"use client";

import { Bell, User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/students':              'Dashboard',
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

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Student Portal';

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
      {/* Page title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden -ml-1 mr-1 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="w-1 h-5 rounded-full bg-orange-600 shrink-0 hidden sm:block" />
        <h1 className="text-base font-semibold text-gray-800 truncate">{pageTitle}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Notification bell */}
        <button
          className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-orange-600" />
        </button>

        {/* Avatar / profile link */}
        <Link
          href="/student/profile"
          className="h-9 w-9 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold hover:bg-orange-700 hover:ring-2 hover:ring-orange-300 hover:ring-offset-1 transition-all ml-1 shrink-0"
          aria-label="Profile"
        >
          S
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
          aria-label="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
