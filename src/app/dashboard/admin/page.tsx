import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const links = [
  { href: "/dashboard/admin/students", label: "Manage Students" },
  { href: "/dashboard/admin/attendance", label: "Add/Edit Attendance" },
  { href: "/dashboard/admin/timetable", label: "Add/Edit Timetable" },
  { href: "/dashboard/admin/tests", label: "Add/Edit Tests" },
  { href: "/dashboard/admin/notices", label: "Post Notices" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="py-6">
                <p className="font-medium text-gray-900">{link.label}</p>
                <p className="text-sm text-gray-500 mt-1">Manage &rarr;</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
