"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { BacklogsTable } from "@/components/admin/AtRisk/BacklogsTable";
import { LowAttendanceTable } from "@/components/admin/AtRisk/LowAttendanceTable";

const TABS = [
  { id: "backlogs", label: "Backlogs", href: "/admin/at-risk/backlogs" },
  { id: "attendance", label: "Low Attendance", href: "/admin/at-risk/attendance" },
] as const;

export function AtRiskView({ activeTab }: { activeTab: "backlogs" | "attendance" }) {
  const pathname = usePathname();

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "At-Risk Students" }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">At-Risk Students</h1>
        <p className="text-sm text-gray-500 mt-1">
          Students who may need intervention — ranked by backlogs or low attendance.
        </p>
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {activeTab === "backlogs" ? <BacklogsTable /> : <LowAttendanceTable />}
    </div>
  );
}
