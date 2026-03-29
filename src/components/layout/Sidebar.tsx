"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  GraduationCap,
  Bell,
  CalendarDays,
  MessageSquare,
  Library,
  User,
  Settings,
  Users,
  FileText,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";

type Role = "student" | "teacher" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { href: "/dashboard/student", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/dashboard/student/courses", label: "Courses", icon: <BookOpen size={20} /> },
  { href: "/dashboard/student/assignments", label: "Assignments", icon: <ClipboardList size={20} /> },
  { href: "/dashboard/student/attendance", label: "Attendance", icon: <CalendarCheck size={20} /> },
  { href: "/dashboard/student/grades", label: "Grades", icon: <GraduationCap size={20} /> },
  { href: "/dashboard/student/timetable", label: "Timetable", icon: <CalendarDays size={20} /> },
  { href: "/dashboard/student/announcements", label: "Announcements", icon: <Bell size={20} /> },
  { href: "/dashboard/student/messages", label: "Messages", icon: <MessageSquare size={20} /> },
  { href: "/dashboard/student/resources", label: "Resources", icon: <Library size={20} /> },
  { href: "/dashboard/student/profile", label: "Profile", icon: <User size={20} /> },
  { href: "/dashboard/student/settings", label: "Settings", icon: <Settings size={20} /> },
];

const teacherNav: NavItem[] = [
  { href: "/dashboard/teacher", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/dashboard/teacher/attendance", label: "Attendance", icon: <CalendarCheck size={20} /> },
  { href: "/dashboard/teacher/grades", label: "Grades", icon: <GraduationCap size={20} /> },
  { href: "/dashboard/teacher/notices", label: "Notices", icon: <Bell size={20} /> },
  { href: "/dashboard/teacher/timetable", label: "Timetable", icon: <CalendarDays size={20} /> },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/dashboard/admin/students", label: "Students", icon: <Users size={20} /> },
  { href: "/dashboard/admin/attendance", label: "Attendance", icon: <CalendarCheck size={20} /> },
  { href: "/dashboard/admin/timetable", label: "Timetable", icon: <CalendarDays size={20} /> },
  { href: "/dashboard/admin/tests", label: "Tests", icon: <FileText size={20} /> },
  { href: "/dashboard/admin/notices", label: "Notices", icon: <Bell size={20} /> },
];

const navByRole: Record<Role, NavItem[]> = {
  student: studentNav,
  teacher: teacherNav,
  admin: adminNav,
};

interface SidebarProps {
  role: Role;
  userEmail?: string;
}

export function Sidebar({ role, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const nav = navByRole[role];

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 shrink-0">
        {!collapsed && (
          <span className="text-lg font-bold text-indigo-600 tracking-tight truncate">
            College ERP
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
            collapsed ? "mx-auto" : ""
          }`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 shrink-0 ${
                  isActive ? "text-indigo-700" : "text-gray-500 group-hover:text-gray-900"
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 shrink-0">
        {!collapsed && userEmail && (
          <p className="text-xs text-gray-400 truncate mb-2" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={`flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors ${
            collapsed ? "justify-center w-full" : ""
          }`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
