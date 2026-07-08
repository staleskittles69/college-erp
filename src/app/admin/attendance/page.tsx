"use client";

import { useEffect, useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";

interface Branch { slug: string; name: string; label: string; }
interface Student { _id: string; name: string; rollNo: string; }
type Status = "present" | "absent";

export default function AdminAttendancePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/departments", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Branch[]) => setBranches(data))
      .catch(() => {});
  }, []);

  function handleBranchChange(value: string) { setBranch(value); setStudents([]); setSubmitted(false); }
  function handleYearChange(value: number | "") { setYear(value); setStudents([]); setSubmitted(false); }
  function handleSectionChange(value: string) { setSection(value); setStudents([]); setSubmitted(false); }

  function loadStudents() {
    if (!branch || !year || !section) return;
    setLoadingStudents(true);
    setSubmitted(false);
    setSubmitError("");
    fetch(`/api/students?branch=${branch}&year=${year}&section=${section}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Student[]) => {
        setStudents(data);
        const init: Record<string, Status> = {};
        data.forEach((student) => { init[student._id] = "present"; });
        setAttendance(init);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }

  function toggle(id: string) {
    setAttendance((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  }

  function markAll(status: Status) {
    const next: Record<string, Status> = {};
    students.forEach((student) => { next[student._id] = status; });
    setAttendance(next);
  }

  async function handleSubmit() {
    if (!subject.trim()) { setSubmitError("Enter a subject before submitting."); return; }
    setSubmitting(true);
    setSubmitError("");
    const bulk = students.map((student) => ({ studentId: student._id, status: attendance[student._id] ?? "present" }));
    const response = await fetch("/api/attendance", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk, subject: subject.trim(), date }),
    });
    if (response.ok) { setSubmitted(true); }
    else { setSubmitError("Failed to save. Please try again."); }
    setSubmitting(false);
  }

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const absentCount = students.length - presentCount;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select a class, enter subject and date, then mark students.</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
            <select
              value={branch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              {branches.map((branchOption) => (
                <option key={branchOption.slug} value={branchOption.slug}>{branchOption.label || branchOption.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              {[1, 2, 3, 4].map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
            <select
              value={section}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              {["A", "B", "C", "D"].map((sectionOption) => <option key={sectionOption} value={sectionOption}>{sectionOption}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadStudents}
              disabled={!branch || !year || !section || loadingStudents}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {loadingStudents ? <RefreshCw size={14} className="animate-spin" /> : null}
              Load Students
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSubmitted(false); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Student list */}
      {students.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {students.length} students &nbsp;·&nbsp; {presentCount} present &nbsp;·&nbsp; {absentCount} absent
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => markAll("present")}
                className="text-xs px-3 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium"
              >
                All Present
              </button>
              <button
                onClick={() => markAll("absent")}
                className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-medium"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {students.map((student) => {
              const isPresent = attendance[student._id] === "present";
              return (
                <div key={student._id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.rollNo}</p>
                  </div>
                  <button
                    onClick={() => toggle(student._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isPresent
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                  >
                    {isPresent ? <><Check size={12} /> Present</> : <><X size={12} /> Absent</>}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            {submitted ? (
              <p className="text-xs text-green-600 font-semibold ml-auto">✓ Attendance saved</p>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Submit Attendance"}
              </button>
            )}
          </div>
        </div>
      )}

      {students.length === 0 && branch && year && section && !loadingStudents && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
          No students found for this class.
        </div>
      )}
    </div>
  );
}
