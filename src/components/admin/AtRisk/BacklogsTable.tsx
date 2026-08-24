"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { studentDetailUrl, yearLabel } from "@/lib/academics";

interface BacklogRow {
  studentId: string;
  name: string;
  rollNo: string;
  branch: string;
  year: number;
  section: string;
  backlogCount: number;
  backlogSubjects: { subject: string; pct: number }[];
}

export function BacklogsTable() {
  const [rows, setRows] = useState<BacklogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/at-risk/backlogs", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Backlogs</h2>
        {!loading && <span className="text-xs text-gray-400">{rows.length} students</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch / Year / Section</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Backlogs</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed Subjects</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                  No at-risk students found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.studentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-gray-400 text-xs">{index + 1}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{row.rollNo}</td>
                  <td className="px-6 py-3.5 font-medium text-gray-800">{row.name}</td>
                  <td className="px-6 py-3.5 text-xs text-gray-500">
                    {row.branch} · {yearLabel(row.year)} · {row.section}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-xs font-semibold text-red-600 bg-red-50">
                      {row.backlogCount}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-gray-500">
                    {row.backlogSubjects.map((s) => s.subject).join(", ")}
                  </td>
                  <td className="px-6 py-3.5">
                    <Link
                      href={studentDetailUrl({ _id: row.studentId, branch: row.branch, year: row.year, section: row.section })}
                      className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium"
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
    </div>
  );
}
