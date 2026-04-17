"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import MarksPanel from "@/components/admin/FeaturePanels/MarksPanel";
import AttendancePanel from "@/components/admin/FeaturePanels/AttendancePanel";
import { User } from "lucide-react";

const TABS = [
  { id: "marks", label: "Marks" },
  { id: "attendance", label: "Attendance" },
];

interface StudentData {
  id: string;
  name: string;
  rollNumber: number;
  branch: string;
  year: number;
  section: string;
}

function fmt(s: string) {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function StudentDetailPage() {
  const params = useParams<{ branch: string; year: string; section: string; studentId: string }>();
  const { branch, year, section, studentId } = params;

  const branchLabel = branch.toUpperCase();
  const yearLabel = fmt(year);
  const sectionLabel = fmt(section);
  const context = `${branchLabel} · ${yearLabel} · ${sectionLabel}`;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("marks");

  useEffect(() => {
    fetch(`/api/student/profile`, { credentials: "include" })
      .catch(() => null);

    // Fetch the specific student by their User ID
    fetch(`/api/admin/students?branch=${branchLabel}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((students: StudentData[]) => {
        const found = students.find((s) => s.id === studentId);
        setStudent(found ?? null);
      })
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, [studentId, branchLabel]);

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Branches", href: "/admin/branches" },
          { label: branchLabel, href: `/admin/${branch}` },
          { label: yearLabel, href: `/admin/${branch}/${year}` },
          { label: sectionLabel, href: `/admin/${branch}/${year}/${section}` },
          { label: loading ? "..." : (student?.name ?? "Student") },
        ]}
      />

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-6 bg-gray-100 rounded w-48" />
                <div className="h-4 bg-gray-100 rounded w-64" />
              </div>
            ) : student ? (
              <>
                <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Roll No: <span className="font-mono text-gray-700">{student.rollNumber}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  {context}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Student not found</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-white rounded-xl border border-gray-200 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "marks" && <MarksPanel studentId={studentId} context={context} />}
        {activeTab === "attendance" && <AttendancePanel studentId={studentId} context={context} />}
      </div>

      <div className="mt-6">
        <Link
          href={`/admin/${branch}/${year}/${section}`}
          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          ← Back to {sectionLabel} students
        </Link>
      </div>
    </div>
  );
}
