"use client";

import { useState } from "react";

const INITIAL_NOTICES = [
  {
    id: 1,
    title: "Mid-Semester Examination Schedule Released",
    body: "The mid-semester examination timetable has been published. Students are advised to check the schedule.",
    date: "2026-03-28",
    pinned: true,
    target: "All Students",
  },
  {
    id: 2,
    title: "Sports Day Registration Open",
    body: "Students can register for Sports Day events through the admin office by 5th April.",
    date: "2026-03-26",
    pinned: false,
    target: "All Students",
  },
  {
    id: 3,
    title: "Library Maintenance Notice",
    body: "The library will remain closed on 1st April for maintenance work.",
    date: "2026-03-25",
    pinned: false,
    target: "All Students",
  },
];

const TARGETS = [
  "All Students",
  "CSE", "ECE", "MECH", "CIVIL",
  "1st Year", "2nd Year", "3rd Year", "4th Year",
];

interface AnnouncementsPanelProps {
  context?: string;
}

export default function AnnouncementsPanel({ context }: AnnouncementsPanelProps) {
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("All Students");
  const [pinned, setPinned] = useState(false);

  function handlePublish() {
    if (!title.trim() || !body.trim()) return;
    setNotices((prev) => [
      {
        id: Date.now(),
        title,
        body,
        date: new Date().toISOString().split("T")[0],
        pinned,
        target,
      },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    setTarget("All Students");
    setPinned(false);
  }

  function handleDelete(id: number) {
    setNotices((prev) => prev.filter((n) => n.id !== id));
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Target:</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none"
                >
                  {TARGETS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Pin announcement
              </label>
            </div>
            <button
              onClick={handlePublish}
              className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Publish
            </button>
          </div>
        </div>
        {context && (
          <p className="mt-3 text-xs text-gray-400">Context: {context}</p>
        )}
      </div>

      {/* Existing Announcements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Announcements</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {notices.map((notice) => (
            <div key={notice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
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
                    {notice.date} · 📢 {notice.target}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
