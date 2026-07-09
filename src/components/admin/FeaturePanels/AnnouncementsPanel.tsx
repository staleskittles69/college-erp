"use client";

import { useEffect, useState } from "react";
import { BRANCHES as FALLBACK_BRANCHES, YEARS, yearLabel } from "@/lib/academics";

interface Notice {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  targetBranch: string | null;
  targetYear: number | null;
  createdAt: string;
}

function formatDate(dateString: string) {
  try { return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateString; }
}

function targetLabel(notice: Notice) {
  if (notice.targetBranch && notice.targetYear) return `${notice.targetBranch} · ${yearLabel(notice.targetYear)}`;
  if (notice.targetBranch) return notice.targetBranch;
  if (notice.targetYear) return yearLabel(notice.targetYear);
  return "All Students";
}

export default function AnnouncementsPanel() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<string[]>(FALLBACK_BRANCHES);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetBranch, setTargetBranch] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  function fetchNotices() {
    return fetch("/api/notices", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then(setNotices)
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotices();
    fetch("/api/departments", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((departments: { name: string }[]) => {
        if (departments.length > 0) setBranches(departments.map((department) => department.name));
      })
      .catch(() => {});
  }, []);

  async function handlePublish() {
    if (!title.trim() || !body.trim()) { setError("Title and body are required."); return; }
    setSaving(true);
    setError("");
    const response = await fetch("/api/notices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        pinned,
        targetBranch: targetBranch || null,
        targetYear: targetYear ? Number(targetYear) : null,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error ?? "Failed to publish.");
    } else {
      setTitle(""); setBody(""); setTargetBranch(""); setTargetYear(""); setPinned(false);
      fetchNotices();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    await fetch(`/api/notices/${id}`, { method: "DELETE", credentials: "include" });
    setDeleting(null);
    fetchNotices();
  }

  return (
    <div className="space-y-5">
      {/* Post New Announcement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Post New Announcement</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement here..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Target audience</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Branch</label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Branches</option>
                  {branches.map((branchOption) => <option key={branchOption} value={branchOption}>{branchOption}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Year</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Years</option>
                  {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>{yearLabel(yearOption)}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Pin announcement
            </label>
            <div className="ml-auto flex items-center gap-3">
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
              >
                {saving ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Announcements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">All Announcements</h3>
          {!loading && <span className="text-xs text-gray-400">{notices.length} total</span>}
        </div>
        {loading ? (
          <div className="px-6 py-10 text-sm text-gray-400 text-center">Loading…</div>
        ) : notices.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-400 text-center">No announcements yet. Post one above.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notices.map((notice) => (
              <div key={notice._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notice.pinned && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded uppercase tracking-wide">
                          Pinned
                        </span>
                      )}
                      <h4 className="font-medium text-gray-800 text-sm">{notice.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{notice.body}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatDate(notice.createdAt)} · 📢 {targetLabel(notice)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(notice._id)}
                    disabled={deleting === notice._id}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0 disabled:opacity-40"
                  >
                    {deleting === notice._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
