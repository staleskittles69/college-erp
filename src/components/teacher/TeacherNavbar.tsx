"use client";

import { usePathname } from "next/navigation";
import { PortalNavbar } from "@/components/ui/PortalNavbar";

// Ordered most-specific-first; '/teachers' matches everything so it stays last as the dashboard fallback.
const PAGE_TITLES: [string, string][] = [
  ["/teachers/students", "Students"],
  ["/teachers/attendance", "Attendance"],
  ["/teachers/timetable", "Timetable"],
  ["/teachers/assignments", "Assignments"],
  ["/teachers/notices", "Notices"],
  ["/teachers/queries", "Queries"],
  ["/teachers/resources", "Resources"],
  ["/teachers/settings", "Settings"],
  ["/teachers", "Dashboard"],
];

function getPageTitle(pathname: string): string {
  const match = PAGE_TITLES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match?.[1] ?? "Teacher Portal";
}

export function TeacherNavbar({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <PortalNavbar
      pageTitle={pageTitle}
      onMenuClick={onMenuClick}
      avatar={
        <div className="h-9 w-9 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold ml-1 shrink-0">
          {name ? name.charAt(0).toUpperCase() : "T"}
        </div>
      }
    />
  );
}
