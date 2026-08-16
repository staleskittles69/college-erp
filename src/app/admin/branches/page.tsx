"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { ArrowRight, Users, Plus, X, RefreshCw, Trash2 } from "lucide-react";

const COLORS = [
  { color: "border-orange-200 hover:border-orange-400", badge: "bg-orange-100 text-orange-700" },
  { color: "border-orange-200 hover:border-orange-400",     badge: "bg-orange-100 text-orange-700" },
  { color: "border-orange-200 hover:border-orange-400", badge: "bg-orange-100 text-orange-700" },
  { color: "border-green-200 hover:border-green-400",   badge: "bg-green-100 text-green-700" },
  { color: "border-rose-200 hover:border-rose-400",     badge: "bg-rose-100 text-rose-700" },
  { color: "border-purple-200 hover:border-purple-400", badge: "bg-purple-100 text-purple-700" },
  { color: "border-orange-200 hover:border-orange-400",     badge: "bg-orange-100 text-orange-700" },
];

interface Branch { slug: string; name: string; label: string; }

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", label: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const STANDARD_SLUGS = ["cse", "ece", "me", "ce", "eee"];
  const missingDefaults = STANDARD_SLUGS.some((slug) => !branches.find((branch) => branch.slug === slug));

  async function handleDelete(slug: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/departments/${slug}`, { method: "DELETE", credentials: "include" });
    await fetchBranches();
  }

  async function seedDefaults() {
    setSeeding(true);
    await fetch("/api/admin/seed-departments", { method: "POST", credentials: "include" });
    await fetchBranches();
    setSeeding(false);
  }

  async function fetchBranches() {
    const [deptRes, statsRes] = await Promise.all([
      fetch("/api/departments", { credentials: "include" }),
      fetch("/api/admin/branch-stats", { credentials: "include" }),
    ]);
    if (deptRes.ok) setBranches(await deptRes.json());
    if (statsRes.ok) setSectionCounts(await statsRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchBranches(); }, []);

  async function handleAdd() {
    const name = form.name.trim().toUpperCase();
    const label = form.label.trim();
    if (!name || !label) { setError("Code and name are required."); return; }
    setSaving(true);
    setError("");
    const colorStr = COLORS[branches.length % COLORS.length].color;
    const response = await fetch("/api/departments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: name.toLowerCase(), name, label, color: colorStr }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error ?? "Failed to add branch.");
      setSaving(false);
      return;
    }
    setForm({ name: "", label: "" });
    setOpen(false);
    setSaving(false);
    await fetchBranches();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Branches" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">Select a branch to view years, sections, and students.</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && missingDefaults && (
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={seeding ? "animate-spin" : ""} />
              {seeding ? "Adding…" : "Add Default Branches"}
            </button>
          )}
          <button
            onClick={() => { setOpen(true); setError(""); }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Branch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((skeletonIdx) => (
            <div key={skeletonIdx} className="bg-white rounded-xl border-2 border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-16 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 flex flex-col items-center justify-center text-center">
          <p className="font-semibold text-gray-600">No branches yet</p>
          <p className="text-sm text-gray-400 mt-1">Click &quot;Add Branch&quot; to create your first branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {branches.map((branch, colorIdx) => {
            const { color, badge } = COLORS[colorIdx % COLORS.length];
            return (
              <div key={branch.slug} className="relative group/card">
                <Link
                  href={`/admin/${branch.slug}`}
                  className={`bg-white rounded-xl border-2 p-6 block group transition-all duration-150 ${color}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold mb-2 ${badge}`}>
                        {branch.name}
                      </span>
                      <h2 className="text-base font-semibold text-gray-800">{branch.label}</h2>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-4">
                    <Users size={14} className="text-gray-400" />
                    <span>
                      {sectionCounts[branch.slug] != null
                        ? `${sectionCounts[branch.slug]} section${sectionCounts[branch.slug] !== 1 ? "s" : ""}`
                        : "No sections yet"}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(branch.slug, branch.name)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover/card:opacity-100 transition-all shadow-sm"
                  title="Delete branch"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Add Branch</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Branch Code</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. IT"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Information Technology"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
                {saving ? "Adding…" : "Add Branch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
