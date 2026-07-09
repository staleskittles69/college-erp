"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";

interface Props {
  departmentSlug: string;
  onClose: () => void;
}

export default function AddTeacherModal({ departmentSlug, onClose }: Props) {
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
    setError("");
    setSubmitting(true);
    try {
      await addTeacher({ name: name.trim(), email: email.trim(), password: password.trim() || "teacher123", department: departmentSlug });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Add Teacher</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
            <input
              type="text"
              placeholder="Dr. Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="Set initial password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
