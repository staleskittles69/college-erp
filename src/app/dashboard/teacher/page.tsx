import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";

const quickLinks = [
  { href: "/dashboard/teacher/attendance", label: "Mark Attendance" },
  { href: "/dashboard/teacher/grades", label: "Enter Grades" },
  { href: "/dashboard/teacher/notices", label: "Post Notice" },
  { href: "/dashboard/teacher/timetable", label: "View Timetable" },
];

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="py-6">
                <p className="font-medium text-gray-900">{link.label}</p>
                <p className="text-sm text-gray-500 mt-1">Go &rarr;</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
