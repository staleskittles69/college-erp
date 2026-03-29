import Link from "next/link";
import {
  Users,
  GitBranch,
  Bell,
  Calendar,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const STATS = [
  { label: "Total Students", value: "1,240", icon: Users, color: "bg-indigo-50 text-indigo-600" },
  { label: "Branches", value: "4", icon: GitBranch, color: "bg-blue-50 text-blue-600" },
  { label: "Active Notices", value: "8", icon: Bell, color: "bg-amber-50 text-amber-600" },
  { label: "Tests Scheduled", value: "5", icon: ClipboardList, color: "bg-green-50 text-green-600" },
];

const BRANCHES = [
  { name: "CSE", slug: "cse", label: "Computer Science & Engineering", students: 320, color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50" },
  { name: "ECE", slug: "ece", label: "Electronics & Communication", students: 280, color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
  { name: "MECH", slug: "mech", label: "Mechanical Engineering", students: 340, color: "border-orange-200 hover:border-orange-400 hover:bg-orange-50" },
  { name: "CIVIL", slug: "civil", label: "Civil Engineering", students: 300, color: "border-green-200 hover:border-green-400 hover:bg-green-50" },
];

const QUICK_LINKS = [
  { label: "Manage Marks", href: "/admin/features/marks", icon: TrendingUp },
  { label: "Mark Attendance", href: "/admin/features/attendance", icon: Calendar },
  { label: "Post Announcement", href: "/admin/features/announcements", icon: Bell },
  { label: "Edit Timetable", href: "/admin/features/timetable", icon: Calendar },
  { label: "Add Student", href: "/admin/features/students", icon: Users },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, Admin. Here&apos;s an overview of the college.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Select Branch</h2>
          <Link
            href="/admin/branches"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {BRANCHES.map((branch) => (
            <Link
              key={branch.slug}
              href={`/admin/${branch.slug}`}
              className={`bg-white rounded-xl border-2 px-5 py-5 block transition-all duration-150 group ${branch.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-900">{branch.name}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{branch.label}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-300 group-hover:text-gray-500 mt-0.5 transition-colors"
                />
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-4">
                {branch.students} <span className="font-normal text-gray-400 text-xs">students</span>
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors font-medium"
            >
              <link.icon size={15} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
