"use client";

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
  ChevronLeft
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/student/dashboard' },
    { icon: <BookOpen size={20} />, label: 'Courses', href: '/student/courses' },
    { icon: <ClipboardList size={20} />, label: 'Assignments', href: '/student/assignments' },
    { icon: <CalendarCheck size={20} />, label: 'Attendance', href: '/student/attendance' },
    { icon: <GraduationCap size={20} />, label: 'Grades', href: '/student/grades' },
    { icon: <Bell size={20} />, label: 'Announcements', href: '/student/announcements' },
    { icon: <CalendarDays size={20} />, label: 'Timetable', href: '/student/timetable' },
    { icon: <MessageSquare size={20} />, label: 'Messages', href: '/student/messages' },
    { icon: <Library size={20} />, label: 'Resources', href: '/student/resources' },
    { icon: <User size={20} />, label: 'Profile', href: '/student/profile' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/student/settings' },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800 shrink-0">
        {!isCollapsed && <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Portal</span>}
        <button 
          onClick={toggleSidebar}
          className={`rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.href}
              {...item}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
