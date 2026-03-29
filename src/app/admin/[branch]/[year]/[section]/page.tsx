import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { ArrowRight } from "lucide-react";

const PLACEHOLDER_STUDENTS = [
  { id: "stu-001", name: "Rahul Sharma", rollNo: "001", email: "rahul@college.edu", status: "Active" },
  { id: "stu-002", name: "Priya Patel", rollNo: "002", email: "priya@college.edu", status: "Active" },
  { id: "stu-003", name: "Amit Kumar", rollNo: "003", email: "amit@college.edu", status: "Active" },
  { id: "stu-004", name: "Sneha Reddy", rollNo: "004", email: "sneha@college.edu", status: "Inactive" },
  { id: "stu-005", name: "Vikram Singh", rollNo: "005", email: "vikram@college.edu", status: "Active" },
  { id: "stu-006", name: "Ananya Iyer", rollNo: "006", email: "ananya@college.edu", status: "Active" },
  { id: "stu-007", name: "Rohan Mehta", rollNo: "007", email: "rohan@college.edu", status: "Active" },
  { id: "stu-008", name: "Divya Nair", rollNo: "008", email: "divya@college.edu", status: "Active" },
];

function fmt(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatBranch(s: string) {
  return s.toUpperCase();
}

interface Props {
  params: { branch: string; year: string; section: string };
}

export default function StudentListPage({ params }: Props) {
  const { branch, year, section } = params;
  const branchLabel = formatBranch(branch);
  const yearLabel = fmt(year);
  const sectionLabel = fmt(section);

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Branches", href: "/admin/branches" },
          { label: branchLabel, href: `/admin/${branch}` },
          { label: yearLabel, href: `/admin/${branch}/${year}` },
          { label: sectionLabel },
        ]}
      />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {branchLabel} · {yearLabel} · {sectionLabel}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {PLACEHOLDER_STUDENTS.length} students enrolled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/${branch}/${year}/${section}/features/attendance`}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Attendance
          </Link>
          <Link
            href={`/admin/${branch}/${year}/${section}/features/marks`}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Marks
          </Link>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Students</h2>
          <input
            type="text"
            placeholder="Search student..."
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PLACEHOLDER_STUDENTS.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{s.rollNo}</td>
                  <td className="px-6 py-3.5 font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{s.email}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        s.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/admin/${branch}/${year}/${section}/${s.id}`}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {PLACEHOLDER_STUDENTS.length} students in {sectionLabel}
        </div>
      </div>
    </div>
  );
}
