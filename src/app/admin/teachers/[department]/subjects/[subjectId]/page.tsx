"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Mail, Plus, UserPlus, X, ChevronRight } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import Breadcrumb from "@/components/shared/Breadcrumb";
import AddTeacherModal from "@/components/admin/teachers/AddTeacherModal";

interface SubjectDetail {
  id: string;
  name: string;
  department: string;
  teachers: { id: string; name: string; email: string }[];
}

export default function SubjectPage() {
  const { department: slug, subjectId } = useParams() as { department: string; subjectId: string };
  const { teachers: deptTeachers, departments } = useTeachers();
  const dept = departments.find((department) => department.slug === slug);

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignId, setAssignId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  function fetchSubject() {
    return fetch(`/api/admin/subjects/${subjectId}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setSubject)
      .catch(() => setError("Couldn't load this subject."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function handleAssignExisting() {
    if (!assignId) return;
    setAssigning(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addTeacherId: assignId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to assign teacher");
      setSubject(body);
      setAssignId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(teacherId: string) {
    const response = await fetch(`/api/admin/subjects/${subjectId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeTeacherId: teacherId }),
    });
    if (response.ok) setSubject(await response.json());
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto pt-16 text-center text-sm text-gray-400">Loading…</div>;
  }
  if (!subject) {
    return <div className="max-w-4xl mx-auto pt-16 text-center text-sm text-gray-400">{error || "Subject not found."}</div>;
  }

  const assignedIds = new Set(subject.teachers.map((teacher) => teacher.id));
  const assignableTeachers = deptTeachers.filter((teacher) => teacher.department === slug && !assignedIds.has(teacher.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: "Teachers", href: "/admin/teachers" },
          { label: dept?.name ?? slug, href: `/admin/teachers/${slug}` },
          { label: subject.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{dept?.name ?? slug}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={15} /> New Teacher
        </button>
      </div>

      {assignableTeachers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <UserPlus size={16} className="text-gray-400 flex-shrink-0" />
          <select
            value={assignId}
            onChange={(e) => setAssignId(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          >
            <option value="">Assign an existing {dept?.name ?? slug} teacher…</option>
            {assignableTeachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
          <button
            onClick={handleAssignExisting}
            disabled={!assignId || assigning}
            className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-60"
          >
            {assigning ? "Assigning…" : "Assign"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="space-y-3">
        {subject.teachers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
            No teachers assigned yet.
          </div>
        ) : (
          subject.teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold text-lg">
                {teacher.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Mail size={11} /> {teacher.email}
                </p>
              </div>
              <button
                onClick={() => handleRemove(teacher.id)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={12} /> Remove
              </button>
              <Link
                href={`/admin/teachers/${slug}/${teacher.id}`}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
              >
                View Details <ChevronRight size={13} />
              </Link>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <AddTeacherModal
          departmentSlug={slug}
          subjectId={subjectId}
          onDone={fetchSubject}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
