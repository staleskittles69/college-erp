"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Calendar, Eye, EyeOff, Copy, Check, Trash2 } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import { validatePasswordStrength } from "@/lib/passwordRules";
import Breadcrumb from "@/components/shared/Breadcrumb";
import AssignClassModal from "@/components/admin/teachers/AssignClassModal";
import TeacherTimetableModal from "@/components/admin/teachers/TeacherTimetableModal";

export default function TeacherDetailsPage() {
  const { department: slug, teacherId } = useParams() as { department: string; teacherId: string };
  const router = useRouter();
  const { teachers, departments, removeSection, setTeacherPassword, removeTeacher } = useTeachers();
  const dept = departments.find((department) => department.slug === slug);
  const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
  const [showTimetable, setShowTimetable] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1500);
  }

  function openPasswordForm() {
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess(false);
    setShowPasswordForm(true);
  }

  async function handleSetPassword() {
    setResetError("");
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) { setResetError(strengthError); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match"); return; }

    setResetting(true);
    try {
      await setTeacherPassword(teacherId, newPassword);
      setResetSuccess(true);
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Failed to set password");
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete() {
    if (!teacher) return;
    if (!confirm(`Delete ${teacher.name}? This removes their account and all class assignments. This cannot be undone.`)) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await removeTeacher(teacher.id);
      router.push(`/admin/teachers/${slug}`);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete teacher");
      setDeleting(false);
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
            >
              + Assign Class
            </button>
            <button
              onClick={() => setShowTimetable(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
            >
              <Calendar size={13} /> Edit Timetable
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-60"
            >
              <Trash2 size={13} /> {deleting ? "Deleting..." : "Delete Teacher"}
            </button>
          </div>
        </div>
        {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl flex-shrink-0">
            {teacher.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{teacher.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 rounded-full">
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
              onClick={() => copyToClipboard(teacher.email)}
              className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {copiedEmail ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copiedEmail ? "Copied" : "Copy"}
            </button>
          </div>
          {/* Password row */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Password</p>
                <p className="text-sm text-gray-400 italic">Not stored — set a new one to change it</p>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={openPasswordForm}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-white bg-orange-600 hover:bg-orange-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Set new password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex-shrink-0 p-1.5 text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">At least 8 characters, with a letter and a number.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSetPassword}
                    disabled={resetting}
                    className="text-xs text-white bg-orange-600 hover:bg-orange-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {resetting ? "Saving..." : "Save password"}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="text-xs text-gray-600 border border-gray-200 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          {resetError && <p className="text-xs text-red-500">{resetError}</p>}
          {resetSuccess && <p className="text-xs text-green-600">Password updated.</p>}
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
                    <span className="text-orange-600">{section}</span>
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
          teacherId={teacher.id}
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
