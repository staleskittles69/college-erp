"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface SidebarProps {
  role: "student" | "admin";
  userEmail?: string;
}

const studentNav: NavItem[] = [
  { href: "/dashboard/student", label: "Dashboard" },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Dashboard" },
  { href: "/dashboard/admin/students", label: "Students" },
  { href: "/dashboard/admin/attendance", label: "Attendance" },
  { href: "/dashboard/admin/timetable", label: "Timetable" },
  { href: "/dashboard/admin/tests", label: "Tests" },
  { href: "/dashboard/admin/notices", label: "Notices" },
];

export function Sidebar({ role, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "admin" ? adminNav : studentNav;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <Link href={role === "admin" ? "/dashboard/admin" : "/dashboard/student"} className="text-xl font-bold text-indigo-600">
          College ERP
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        {userEmail && (
          <p className="text-xs text-gray-500 truncate" title={userEmail}>
            {userEmail}
          </p>
        )}
        <form action="/api/auth/logout" method="POST" className="mt-2">
          <button
            type="button"
            onClick={() => {
              document.cookie = "token=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
