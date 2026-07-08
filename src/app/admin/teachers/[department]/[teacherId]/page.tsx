"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { X, Calendar, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import Breadcrumb from "@/components/admin/Breadcrumb";
import AssignClassModal from "@/components/admin/teachers/AssignClassModal";
import TeacherTimetableModal from "@/components/admin/teachers/TeacherTimetableModal";

export default function TeacherDetailsPage() {
  const { department: slug, teacherId } = useParams() as { department: string; teacherId: string };
  const { teachers, departments, removeSection } = useTeachers();
  const dept = departments.find((department) => department.slug === slug);
  const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  function copyToClipboard(text: string, which: "email" | "password") {
    navigator.clipboard.writeText(text);
    if (which === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 1500);
    }
  }

  if (!teacher) {
    return (
      <div className="max-w-4xl mx-auto pt-16 text-center text-sm text-gray-400">
        Teacher not found.
      </div>
    );
  }

  const totalSections = teacher.teaching.reduce((sum, assignment) => sum + assignment.sections.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Teachers", href: "/admin/teachers" },
          { label: dept?.name ?? slug, href: `/admin/teachers/${slug}` },
          { label: teacher.name },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{teacher.email}</p>
      </div>

      {/* Teacher Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Teacher Info</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Assign Class
            </button>
            <button
              onClick={() => setShowTimetable(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
            >
              <Calendar size={13} /> Edit Timetable
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl flex-shrink-0">
            {teacher.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{teacher.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full">
              {dept?.name ?? teacher.department}
            </span>
          </div>
        </div>
      </div>

      {/* Login Credentials */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Login Credentials</h2>
        <div className="space-y-3">
          {/* Email row */}
          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-medium text-gray-800 truncate">{teacher.email}</p>
            </div>
            <button
              onClick={() => copyToClipboard(teacher.email, "email")}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {copiedEmail ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copiedEmail ? "Copied" : "Copy"}
            </button>
          </div>
          {/* Password row */}
          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Password</p>
              <p className="text-sm font-medium text-gray-800 font-mono">
                {teacher.plainPassword
                  ? showPassword ? teacher.plainPassword : "•".repeat(Math.min(teacher.plainPassword.length, 12))
                  : <span className="text-gray-400 italic text-xs">Set before this feature was added</span>}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {teacher.plainPassword && (
                <>
                  <button
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => copyToClipboard(teacher.plainPassword!, "password")}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedPassword ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copiedPassword ? "Copied" : "Copy"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Classes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Assigned Classes</h2>
          <span className="text-xs text-gray-400">
            {teacher.teaching.length} {teacher.teaching.length === 1 ? "class" : "classes"} · {totalSections} {totalSections === 1 ? "section" : "sections"}
          </span>
        </div>

        {totalSections === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
            No classes assigned yet. Use the form above to add one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {teacher.teaching.flatMap((assignment, assignmentIdx) =>
              assignment.sections.map((section) => (
                <div key={`${assignmentIdx}-${section}`} className="flex items-center justify-between py-3">
                  <p className="text-sm font-medium text-gray-800">
                    {assignment.branch} — Year {assignment.year} —{" "}
                    <span className="text-indigo-600">Section {section}</span>
                  </p>
                  <button
                    onClick={() => removeSection(teacher.id, assignmentIdx, section)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showTimetable && (
        <TeacherTimetableModal
          teacherName={teacher.name}
          onClose={() => setShowTimetable(false)}
        />
      )}

      {showAssign && (
        <AssignClassModal
          teacherId={teacher.id}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
}
