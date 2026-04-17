"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

const STATIC_NOTICES = [
  {
    id: 1,
    type: "Test Reminder",
    message: "Unit Test 2 for Data Structures will be held on 20th April. Syllabus: Trees, Graphs, Hashing.",
    year: "2nd",
    branch: "CSE",
    section: "A",
    postedAt: "14 Apr 2026",
  },
  {
    id: 2,
    type: "Assignment Deadline",
    message: "Submit the Digital Electronics assignment (Exp 5 & 6) by 18th April before 5:00 PM.",
    year: "1st",
    branch: "ECE",
    section: "B",
    postedAt: "13 Apr 2026",
  },
  {
    id: 3,
    type: "Notice",
    message: "College will remain closed on 17th April on account of a local holiday. All classes stand cancelled.",
    year: "All",
    branch: "All",
    section: "All",
    postedAt: "12 Apr 2026",
  },
];

const TYPE_COLORS: Record<string, string> = {
  "Notice": "bg-blue-100 text-blue-700",
  "Test Reminder": "bg-yellow-100 text-yellow-700",
  "Assignment Deadline": "bg-red-100 text-red-700",
};

export default function TeacherNoticesPage() {
  const [type, setType] = useState("Notice");
  const [message, setMessage] = useState("");
  const [year, setYear] = useState("All");
  const [branch, setBranch] = useState("All");
  const [section, setSection] = useState("All");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phase 2: wire up API
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Bell size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Post a Notice</h1>
          <p className="text-sm text-gray-500">Broadcast notices, test reminders, or assignment deadlines</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8 shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Notice</option>
              <option>Test Reminder</option>
              <option>Assignment Deadline</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your notice here..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Target row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>1st</option>
                <option>2nd</option>
                <option>3rd</option>
                <option>4th</option>
                <option>All</option>
              </select>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>CSE</option>
                <option>ECE</option>
                <option>MECH</option>
                <option>CIVIL</option>
                <option>All</option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>All</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Post Notice
          </button>
        </form>
      </div>

      {/* Previously Posted */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">Previously Posted</h2>
      <div className="space-y-3 max-w-2xl">
        {STATIC_NOTICES.map((notice) => (
          <div
            key={notice.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[notice.type]}`}>
                {notice.type}
              </span>
              <span className="text-xs text-gray-400">{notice.postedAt}</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{notice.message}</p>
            <div className="flex gap-2 flex-wrap">
              {[`Year: ${notice.year}`, `Branch: ${notice.branch}`, `Section: ${notice.section}`].map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
