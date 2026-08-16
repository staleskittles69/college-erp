"use client";

import { PortalSidebar } from "@/components/ui/PortalSidebar";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Bell,
  Inbox,
  Library,
  Settings,
} from "lucide-react";

interface TeacherSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  name: string;
  email: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const MENU_ITEMS = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/teachers", exact: true },
  { icon: <Users size={18} />, label: "Students", href: "/teachers/students" },
  { icon: <CalendarCheck size={18} />, label: "Attendance", href: "/teachers/attendance" },
  { icon: <CalendarDays size={18} />, label: "Timetable", href: "/teachers/timetable" },
  { icon: <ClipboardList size={18} />, label: "Assignments", href: "/teachers/assignments" },
  { icon: <Bell size={18} />, label: "Notices", href: "/teachers/notices" },
  { icon: <Inbox size={18} />, label: "Queries", href: "/teachers/queries" },
  { icon: <Library size={18} />, label: "Resources", href: "/teachers/resources" },
  { icon: <Settings size={18} />, label: "Settings", href: "/teachers/settings" },
];

export function TeacherSidebar({ isCollapsed, toggleSidebar, name, email, mobileOpen, onCloseMobile }: TeacherSidebarProps) {
  return (
    <PortalSidebar
      isCollapsed={isCollapsed}
      toggleSidebar={toggleSidebar}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
      menuItems={MENU_ITEMS}
      name={name}
      email={email}
      roleLabel="Teacher"
    />
  );
}
