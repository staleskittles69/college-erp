import Link from "next/link";
import {
  Users,
  CalendarCheck,
  FileText,
  Bell,
  CalendarDays,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Clock,
} from "lucide-react";

const STATS = [
  { label: "My Students", value: "128", icon: Users, color: "bg-indigo-50 text-indigo-600" },
  { label: "Classes Today", value: "4", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
  { label: "Pending Tests", value: "3", icon: FileText, color: "bg-amber-50 text-amber-600" },
  { label: "Avg Attendance", value: "87%", icon: TrendingUp, color: "bg-green-50 text-green-600" },
];

const MY_CLASSES = [
  { subject: "Data Structures", branch: "CSE", year: "2nd Year", section: "A", time: "9:00 AM" },
  { subject: "Algorithms", branch: "CSE", year: "3rd Year", section: "B", time: "11:00 AM" },
  { subject: "DBMS", branch: "ECE", year: "2nd Year", section: "A", time: "2:00 PM" },
];

const QUICK_ACTIONS = [
  { label: "Mark Attendance", href: "/dashboard/admin/attendance", icon: CalendarCheck, color: "hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700" },
  { label: "Add Test Marks", href: "/dashboard/admin/tests", icon: FileText, color: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700" },
  { label: "Post Notice", href: "/dashboard/admin/notices", icon: Bell, color: "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" },
  { label: "View Timetable", href: "/dashboard/admin/timetable", icon: CalendarDays, color: "hover:border-green-300 hover:bg-green-50 hover:text-green-700" },
  { label: "Student List", href: "/dashboard/admin/students", icon: Users, color: "hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700" },
];

export default function TeacherDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here&apos;s your day at a glance.</p>
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

      {/* Today's Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Today&apos;s Classes</h2>
          <Link
            href="/dashboard/admin/timetable"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            Full timetable <ArrowRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {MY_CLASSES.map((cls, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cls.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cls.branch} · {cls.year} · Section {cls.section}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={13} />
                {cls.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors font-medium ${action.color}`}
            >
              <action.icon size={15} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
