"use client";

import { PortalSidebar } from "@/components/ui/PortalSidebar";
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
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  name: string;
  email: string;
}

const MENU_ITEMS = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/student", exact: true },
  { icon: <BookOpen size={18} />, label: "Courses", href: "/student/courses" },
  { icon: <ClipboardList size={18} />, label: "Assignments", href: "/student/assignments" },
  { icon: <CalendarCheck size={18} />, label: "Attendance", href: "/student/attendance" },
  { icon: <GraduationCap size={18} />, label: "Grades", href: "/student/grades" },
  { icon: <Bell size={18} />, label: "Announcements", href: "/student/announcements" },
  { icon: <CalendarDays size={18} />, label: "Timetable", href: "/student/timetable" },
  { icon: <MessageSquare size={18} />, label: "Queries", href: "/student/messages" },
  { icon: <Library size={18} />, label: "Resources", href: "/student/resources" },
  { icon: <User size={18} />, label: "Profile", href: "/student/profile" },
  { icon: <Settings size={18} />, label: "Settings", href: "/student/settings" },
];

export function Sidebar({ isCollapsed, toggleSidebar, mobileOpen, onCloseMobile, name, email }: SidebarProps) {
  return (
    <PortalSidebar
      isCollapsed={isCollapsed}
      toggleSidebar={toggleSidebar}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
      menuItems={MENU_ITEMS}
      name={name}
      email={email}
      roleLabel="Student"
    />
  );
}
