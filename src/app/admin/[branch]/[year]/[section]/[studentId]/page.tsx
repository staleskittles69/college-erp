"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/admin/Breadcrumb";
import MarksPanel from "@/components/admin/FeaturePanels/MarksPanel";
import AttendancePanel from "@/components/admin/FeaturePanels/AttendancePanel";
import AnnouncementsPanel from "@/components/admin/FeaturePanels/AnnouncementsPanel";
import TimetablePanel from "@/components/admin/FeaturePanels/TimetablePanel";
import StudentDataPanel from "@/components/admin/FeaturePanels/StudentDataPanel";
import { User, Mail, Phone, BookOpen } from "lucide-react";

const TABS = [
  { id: "marks", label: "Marks" },
  { id: "attendance", label: "Attendance" },
  { id: "announcements", label: "Announcements" },
  { id: "timetable", label: "Timetable" },
  { id: "data", label: "Student Data" },
];

const PLACEHOLDER_STUDENT = {
  name: "Rahul Sharma",
  rollNo: "CS001",
  email: "rahul@college.edu",
  phone: "9876543210",
  dob: "12 Aug 2004",
  guardian: "Mr. Suresh Sharma",
  address: "42, Nehru Nagar, Hyderabad – 500001",
};

function fmt(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatBranch(s: string) {
  return s.toUpperCase();
}

export default function StudentDetailPage() {
  const params = useParams<{ branch: string; year: string; section: string; studentId: string }>();
  const { branch, year, section } = params;
  const [activeTab, setActiveTab] = useState("marks");

  const branchLabel = formatBranch(branch);
  const yearLabel = fmt(year);
  const sectionLabel = fmt(section);
  const context = `${branchLabel} · ${yearLabel} · ${sectionLabel}`;

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Branches", href: "/admin/branches" },
          { label: branchLabel, href: `/admin/${branch}` },
          { label: yearLabel, href: `/admin/${branch}/${year}` },
          { label: sectionLabel, href: `/admin/${branch}/${year}/${section}` },
          { label: PLACEHOLDER_STUDENT.name },
        ]}
      />

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-indigo-600" />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{PLACEHOLDER_STUDENT.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Roll No: <span className="font-mono text-gray-700">{PLACEHOLDER_STUDENT.rollNo}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  {context}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {[
                { icon: Mail, value: PLACEHOLDER_STUDENT.email },
                { icon: Phone, value: PLACEHOLDER_STUDENT.phone },
                { icon: BookOpen, value: PLACEHOLDER_STUDENT.dob, label: "DOB" },
                { icon: User, value: PLACEHOLDER_STUDENT.guardian, label: "Guardian" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <item.icon size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    {item.label && <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>}
                    <p className="text-xs text-gray-600 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
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
        {activeTab === "marks" && <MarksPanel context={context} />}
        {activeTab === "attendance" && <AttendancePanel context={context} />}
        {activeTab === "announcements" && <AnnouncementsPanel context={context} />}
        {activeTab === "timetable" && <TimetablePanel context={context} />}
        {activeTab === "data" && <StudentDataPanel context={context} />}
      </div>

      {/* Back link */}
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
