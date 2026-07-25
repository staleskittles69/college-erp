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
  X,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isCollapsed, toggleSidebar, mobileOpen, onCloseMobile }: SidebarProps) {
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
        {/* Logo / header */}
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
        <div className="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll">
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
              {userName ? userName[0].toUpperCase() : 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-900 text-sm font-medium truncate">{userName || 'Student'}</p>
              <p className="text-slate-400 text-xs truncate">{userEmail || ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
