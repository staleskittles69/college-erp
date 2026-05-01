"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { ArrowRight, Search } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
}

function urlToBranch(s: string) { return s.toUpperCase(); }
function urlToYear(s: string) {
  const map: Record<string, number> = { "1st-year": 1, "2nd-year": 2, "3rd-year": 3, "4th-year": 4 };
  return map[s] ?? 1;
}
function urlToSection(s: string) {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fmt(s: string) {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function StudentListPage() {
  const params = useParams<{ branch: string; year: string; section: string }>();
  const { branch, year, section } = params;

  const branchLabel = urlToBranch(branch);
  const yearNum = urlToYear(year);
  const sectionLabel = urlToSection(section);
  const yearLabel = fmt(year);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(
      `/api/students?branch=${branchLabel}&year=${yearNum}&section=${encodeURIComponent(sectionLabel)}`,
      { credentials: "include" }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [branchLabel, yearNum, sectionLabel]);

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
            {loading ? "Loading..." : `${students.length} students enrolled`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="font-semibold text-gray-800">Students</h2>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                    No students in this section yet.
                  </td>
                </tr>
              ) : students.filter((s) => s.rollNo.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                    No student found with roll number &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                students
                  .filter((s) => s.rollNo.toLowerCase().includes(search.toLowerCase()))
                  .map((s, i) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{s.rollNo}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">{s.name}</td>
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/${branch}/${year}/${section}/${s._id}`}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {students.length} students in {sectionLabel}
          </div>
        )}
      </div>
    </div>
  );
}
