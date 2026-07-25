"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, X } from "lucide-react";

interface Notice {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  targetBranch: string | null;
  targetYear: number | null;
  createdAt: string;
}

interface Teaching { branch: string; year: number; sections: string[]; }

function formatDate(dateString: string) {
  try { return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateString; }
}

const EMPTY_FORM = { title: "", body: "", targetBranch: "", targetYear: "" };

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [teaching, setTeaching] = useState<Teaching[]>([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function fetchNotices() {
    return fetch("/api/notices", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then(setNotices)
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotices();
    fetch("/api/teachers/me/classes", { credentials: "include" })
      .then((response) => response.ok ? response.json() : { teaching: [] })
      .then((classesData) => setTeaching(classesData.teaching ?? []))
      .catch(() => {});
  }, []);

  // Build list of branch/year combos teacher is allowed to target
  const targets: { label: string; branch: string; year: number }[] = [];
  teaching.forEach((teachingItem) => {
    teachingItem.sections.length > 0
      ? targets.push({ label: `${teachingItem.branch} · Year ${teachingItem.year}`, branch: teachingItem.branch, year: teachingItem.year })
      : null;
  });
  // If no teaching assigned, fall back: nothing scoped (post as global)

  const yearsForBranch = teaching.filter((teachingItem) => teachingItem.branch === form.targetBranch).map((teachingItem) => teachingItem.year);

  function handleBranchChange(value: string) { setForm((prev) => ({ ...prev, targetBranch: value, targetYear: "" })); }

  async function handlePost() {
    if (!form.title.trim() || !form.body.trim()) { setFormError("Title and message are required."); return; }
    setSaving(true);
    setFormError("");
    const response = await fetch("/api/notices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        body: form.body.trim(),
        targetBranch: form.targetBranch || null,
        targetYear: form.targetYear ? Number(form.targetYear) : null,
      }),
    });
    if (!response.ok) { const result = await response.json(); setFormError(result.error ?? "Failed to post."); setSaving(false); return; }
    setForm(EMPTY_FORM);
    setOpen(false);
    setSaving(false);
    setLoading(true);
    fetchNotices();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notices</h1>
            <p className="text-sm text-gray-500">College-wide notices and announcements</p>
          </div>
        </div>
        <button
          onClick={() => { setOpen(true); setFormError(""); }}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Post Notice
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse max-w-2xl">
          {[1, 2, 3].map((skeletonIdx) => <div key={skeletonIdx} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      ) : notices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 flex flex-col items-center justify-center gap-4 text-center max-w-2xl">
          <Bell size={28} className="text-gray-300" />
          <div>
            <p className="font-semibold text-gray-500">No notices posted</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to post a notice for your class.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notices.map((notice) => (
            <div key={notice._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-1.5 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.pinned && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Pinned</span>
                  )}
                  {notice.targetBranch && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {notice.targetBranch}{notice.targetYear ? ` · Year ${notice.targetYear}` : ""}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-gray-800">{notice.title}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(notice.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{notice.body}</p>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Post Notice</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Assignment deadline reminder"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message <span className="text-red-400">*</span></label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your notice here..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Branch</label>
                  <select
                    value={form.targetBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All students</option>
                    {[...new Set(teaching.map((teachingItem) => teachingItem.branch))].map((branchOption) => (
                      <option key={branchOption} value={branchOption}>{branchOption}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Year</label>
                  <select
                    value={form.targetYear}
                    onChange={(e) => setForm((prev) => ({ ...prev, targetYear: e.target.value }))}
                    disabled={!form.targetBranch}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="">{form.targetBranch ? "All years" : "Select branch first"}</option>
                    {yearsForBranch.map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">Leave branch empty to post to all students.</p>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
              <button
                onClick={handlePost}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Posting…" : "Post Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
