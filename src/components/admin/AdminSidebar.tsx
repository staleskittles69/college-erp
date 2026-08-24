"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Bell,
  Calendar,
  CalendarCheck,
  Settings,
  ClipboardList,
  ListChecks,
  Inbox,
  Hash,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/branches", label: "Branches", icon: Building2 },
  { href: "/admin/features/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/tests", label: "Schedule Tests", icon: ListChecks },
  { href: "/admin/features/announcements", label: "Announcements", icon: Bell },
  { href: "/admin/features/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/at-risk", label: "At-Risk", icon: AlertTriangle },
  { href: "/admin/queries", label: "Queries", icon: Inbox },
  { href: "/admin/forums", label: "Forums", icon: Hash },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:relative left-0 top-0 z-40 flex flex-col bg-white text-slate-900 border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0 h-screen md:min-h-screen w-64 ${
          collapsed ? "md:w-16" : "md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-between h-16 border-b border-gray-200 px-5 ${
            collapsed ? "md:justify-center md:px-2" : ""
          }`}
        >
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <img src="/logo-nri.png" alt="NRI University" className="h-8 w-auto shrink-0" />
            <span className="text-base font-bold text-slate-900 tracking-tight truncate">NRI University</span>
          </div>
          <img
            src="/logo2.png"
            alt="NRI University"
            className={`hidden w-8 h-8 rounded-lg object-cover ${collapsed ? "md:block" : ""}`}
          />
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-slate-900 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  collapsed ? "md:justify-center" : ""
                } ${
                  isActive
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer label */}
        <div className={`px-5 pb-4 ${collapsed ? "md:hidden" : ""}`}>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Admin Panel
          </p>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3.5 top-[72px] z-10 items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-full text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
