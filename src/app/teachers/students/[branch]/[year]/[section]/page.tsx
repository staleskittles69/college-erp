"use client";

import Breadcrumb from "@/components/shared/Breadcrumb";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function formatYear(yearSlug: string) {
  return yearSlug.split("-").map((word, wordIdx) => (wordIdx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))).join(" ");
}

function formatSection(sectionSlug: string) {
  return sectionSlug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

const YEAR_TO_NUMBER: Record<string, number> = {
  "1st-year": 1,
  "2nd-year": 2,
  "3rd-year": 3,
  "4th-year": 4,
};

interface Student {
  _id: string;
  rollNo: string;
  name: string;
}

export default function StudentListPage() {
  const params = useParams<{ branch: string; year: string; section: string }>();
  const { branch, year, section } = params;

  const branchLabel = branch.toUpperCase();
  const yearLabel = formatYear(year);
  const sectionLabel = formatSection(section);
  const yearNumber = YEAR_TO_NUMBER[year] ?? 1;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = `/api/students?branch=${branchLabel}&year=${yearNumber}&section=${encodeURIComponent(sectionLabel)}`;
    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result)) setStudents(result);
        else setError(result.error ?? "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [branchLabel, yearNumber, sectionLabel]);

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb
        homeHref="/teachers"
        items={[
          { label: "Students", href: "/teachers/students" },
          { label: branchLabel, href: `/teachers/students/${branch}` },
          { label: yearLabel, href: `/teachers/students/${branch}/${year}` },
          { label: sectionLabel },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {branchLabel} · {yearLabel} · {sectionLabel}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? "Loading..." : `${students.length} students enrolled`}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Students</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading students…</div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-red-500">{error}</div>
        ) : students.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No students found for this section.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-gray-400 text-xs">{index + 1}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{student.rollNo}</td>
                      <td className="px-6 py-3.5 font-medium text-gray-800">{student.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {students.length} students in {sectionLabel}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
