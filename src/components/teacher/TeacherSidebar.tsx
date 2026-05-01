"use client";

import { SidebarItem } from '@/components/sidebar/SidebarItem';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Menu,
  ChevronLeft,
  Bell,
} from 'lucide-react';

interface TeacherSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  name: string;
  email: string;
}

export function TeacherSidebar({ isCollapsed, toggleSidebar, name, email }: TeacherSidebarProps) {
  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard',   href: '/teachers' },
    { icon: <Users size={18} />,           label: 'Students',    href: '/teachers/students' },
    { icon: <CalendarCheck size={18} />,   label: 'Attendance',  href: '/teachers/attendance' },
    { icon: <CalendarDays size={18} />,    label: 'Timetable',   href: '/teachers/timetable' },
    { icon: <ClipboardList size={18} />,   label: 'Assignments', href: '/teachers/assignments' },
    { icon: <Bell size={18} />,            label: 'Notices',     href: '/teachers/notices' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-[#0a1f44] transition-all duration-300 flex flex-col shadow-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center shrink-0 border-b border-white/10 px-4">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="mx-auto rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Expand sidebar"
          >
            <Menu size={20} />
          </button>
        ) : (
          <div className="flex items-center w-full">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap size={14} className="text-white" />
              </div>
              <span className="text-white font-bold text-base tracking-tight truncate">NRI University</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-0.5">
          {menuItems.map((item) => (
            <SidebarItem key={item.href} {...item} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </div>

      {/* User footer */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {name ? name.charAt(0).toUpperCase() : "T"}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{name || "Teacher"}</p>
              <p className="text-white/40 text-xs truncate">{email || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
