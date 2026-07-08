"use client";

import { useEffect, useState } from 'react';
import { SidebarItem } from './SidebarItem';
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
  Menu,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(profile => {
        if (profile) {
          setUserName(profile.name || profile.email?.split('@')[0] || 'Student');
          setUserEmail(profile.email || '');
        }
      })
      .catch(() => {});
  }, []);
  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/students' },
    { icon: <BookOpen size={18} />, label: 'Courses', href: '/student/courses' },
    { icon: <ClipboardList size={18} />, label: 'Assignments', href: '/student/assignments' },
    { icon: <CalendarCheck size={18} />, label: 'Attendance', href: '/student/attendance' },
    { icon: <GraduationCap size={18} />, label: 'Grades', href: '/student/grades' },
    { icon: <Bell size={18} />, label: 'Announcements', href: '/student/announcements' },
    { icon: <CalendarDays size={18} />, label: 'Timetable', href: '/student/timetable' },
    { icon: <MessageSquare size={18} />, label: 'Messages', href: '/student/messages' },
    { icon: <Library size={18} />, label: 'Resources', href: '/student/resources' },
    { icon: <User size={18} />, label: 'Profile', href: '/student/profile' },
    { icon: <Settings size={18} />, label: 'Settings', href: '/student/settings' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-[#0a1f44] transition-all duration-300 flex flex-col shadow-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo / header */}
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
              <span className="text-white font-bold text-base tracking-tight truncate">EduPortal</span>
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
      <div className="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll">
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
              {userName ? userName[0].toUpperCase() : 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{userName || 'Student'}</p>
              <p className="text-white/40 text-xs truncate">{userEmail || ''}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
