"use client";

import { Bell, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/teacher/dashboard':   'Dashboard',
  '/teacher/students':    'Students',
  '/teacher/attendance':  'Attendance',
  '/teacher/timetable':   'Timetable',
  '/teacher/assignments': 'Assignments',
};

export function TeacherNavbar({ name }: { name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Teacher Portal';

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-blue-600" />
        <h1 className="text-base font-semibold text-gray-800">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-blue-600" />
        </button>

        <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold ml-1">
          {name ? name.charAt(0).toUpperCase() : "T"}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
