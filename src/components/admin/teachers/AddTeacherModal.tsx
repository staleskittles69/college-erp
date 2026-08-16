"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useTeachers } from "@/contexts/TeachersContext";

interface Props {
  departmentSlug: string;
  subjectId?: string;
  onClose: () => void;
  onDone?: () => void;
}

export default function AddTeacherModal({ departmentSlug, subjectId, onClose, onDone }: Props) {
  const { addTeacher, departments } = useTeachers();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const department = departments.find((departmentOption) => departmentOption.slug === departmentSlug);

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!password.trim()) {
      setError("Set a password for this teacher.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { id: newTeacherId } = await addTeacher({ name: name.trim(), email: email.trim(), password: password.trim(), department: departmentSlug });
      if (subjectId) {
        await fetch(`/api/admin/subjects/${subjectId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addTeacherId: newTeacherId }),
        });
      }
      onDone?.();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add Teacher" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
          <input
            type="text"
            placeholder="Dr. Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <input
            type="email"
            placeholder="teacher@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
          <input
            type="password"
            placeholder="Set initial password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Department</label>
          <input
            type="text"
            value={department?.name ?? departmentSlug}
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Teacher"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
