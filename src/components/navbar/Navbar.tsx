"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalNavbar } from "@/components/ui/PortalNavbar";

const PAGE_TITLES: Record<string, string> = {
  "/student": "Dashboard",
  "/student/courses": "Courses",
  "/student/assignments": "Assignments",
  "/student/attendance": "Attendance",
  "/student/grades": "Grades",
  "/student/announcements": "Announcements",
  "/student/timetable": "Timetable",
  "/student/messages": "Messages",
  "/student/resources": "Resources",
  "/student/profile": "Profile",
  "/student/settings": "Settings",
};

interface NavbarProps {
  onMenuClick: () => void;
  name: string;
}

export function Navbar({ onMenuClick, name }: NavbarProps) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Student Portal";

  return (
    <PortalNavbar
      pageTitle={pageTitle}
      onMenuClick={onMenuClick}
      avatar={
        <Link
          href="/student/profile"
          className="h-9 w-9 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold hover:bg-orange-700 hover:ring-2 hover:ring-orange-300 hover:ring-offset-1 transition-all ml-1 shrink-0"
          aria-label="Profile"
        >
          {name ? name.charAt(0).toUpperCase() : "S"}
        </Link>
      }
    />
  );
}
