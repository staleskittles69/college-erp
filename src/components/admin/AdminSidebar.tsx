"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  GraduationCap,
  Bell,
  Calendar,
  CalendarCheck,
  Settings,
  ClipboardList,
  ListChecks,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/branches", label: "Branches", icon: GitBranch },
  { href: "/admin/features/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/tests", label: "Schedule Tests", icon: ListChecks },
  { href: "/admin/features/announcements", label: "Announcements", icon: Bell },
  { href: "/admin/features/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out flex-shrink-0 ${
        collapsed ? "w-16" : "w-64"
      } min-h-screen`}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-16 border-b border-slate-700 ${
          collapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        {collapsed ? (
          <span className="text-base font-bold text-indigo-400">E</span>
        ) : (
          <span className="text-base font-bold text-white tracking-tight">
            College ERP
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 space-y-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer label */}
      {!collapsed && (
        <div className="px-5 pb-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
            Admin Panel
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-[72px] z-10 flex items-center justify-center w-7 h-7 bg-slate-900 border border-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
