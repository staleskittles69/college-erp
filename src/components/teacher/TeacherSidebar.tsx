"use client";

import { SidebarItem } from '@/components/sidebar/SidebarItem';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Menu,
  ChevronLeft,
  Bell,
  Inbox,
  Settings,
  X,
} from 'lucide-react';

interface TeacherSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  name: string;
  email: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function TeacherSidebar({ isCollapsed, toggleSidebar, name, email, mobileOpen, onCloseMobile }: TeacherSidebarProps) {
  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard',   href: '/teachers' },
    { icon: <Users size={18} />,           label: 'Students',    href: '/teachers/students' },
    { icon: <CalendarCheck size={18} />,   label: 'Attendance',  href: '/teachers/attendance' },
    { icon: <CalendarDays size={18} />,    label: 'Timetable',   href: '/teachers/timetable' },
    { icon: <ClipboardList size={18} />,   label: 'Assignments', href: '/teachers/assignments' },
    { icon: <Bell size={18} />,            label: 'Notices',     href: '/teachers/notices' },
    { icon: <Inbox size={18} />,           label: 'Queries',     href: '/teachers/queries' },
    { icon: <Settings size={18} />,        label: 'Settings',    href: '/teachers/settings' },
  ];

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
        className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm w-64 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center shrink-0 border-b border-gray-200 px-4">
          {isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden md:mx-auto md:flex rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-900 transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          <div className={`items-center w-full flex ${isCollapsed ? 'md:hidden' : ''}`}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <img src="/logo-nri.png" alt="NRI University" className="h-7 w-auto shrink-0" />
              <span className="text-slate-900 font-bold text-base tracking-tight truncate">NRI University</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden md:flex rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={onCloseMobile}
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <SidebarItem key={item.href} {...item} isCollapsed={isCollapsed} onNavigate={onCloseMobile} />
            ))}
          </nav>
        </div>

        {/* User footer */}
        <div className={`px-4 py-4 border-t border-gray-200 shrink-0 ${isCollapsed ? 'md:hidden' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
              {name ? name.charAt(0).toUpperCase() : "T"}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-900 text-sm font-medium truncate">{name || "Teacher"}</p>
              <p className="text-slate-400 text-xs truncate">{email || "—"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
