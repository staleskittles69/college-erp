"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import { Department } from "@/lib/teachersData";

const COLOR_SEQUENCE = [
  "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50",
  "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
  "border-green-200 hover:border-green-400 hover:bg-green-50",
  "border-orange-200 hover:border-orange-400 hover:bg-orange-50",
  "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
  "border-rose-200 hover:border-rose-400 hover:bg-rose-50",
];

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function uniqueSlug(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

interface Props {
  mode: "add" | "edit";
  existing?: Department;
  onClose: () => void;
}

export default function DepartmentFormModal({ mode, existing, onClose }: Props) {
  const { departments, addDepartment, updateDepartment } = useTeachers();
  const [name, setName] = useState(existing?.name ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) { setError("Department name is required."); return; }

    setSaving(true);
    try {
      if (mode === "add") {
        const existingSlugs = departments.map((d) => d.slug);
        const slug = uniqueSlug(toSlug(trimmed), existingSlugs);
        const color = COLOR_SEQUENCE[departments.length % COLOR_SEQUENCE.length];
        await addDepartment({ slug, name: trimmed, label: trimmed, color });
      } else if (existing) {
        await updateDepartment(existing.slug, {
          name: trimmed,
          label: trimmed,
          color: existing.color,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "add" ? "Add Department" : "Edit Department"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Department Name</label>
            <input
              type="text"
              placeholder="e.g. Web Dev"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "add" ? "Add Department" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
