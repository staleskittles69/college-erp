"use client";

import { useEffect, useState } from "react";
import { Users, Check, X } from "lucide-react";

interface Teaching { branch: string; year: number; sections: string[]; }
interface Student { _id: string; name: string; rollNumber: string; }
type Status = "present" | "absent";

export default function AttendancePage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const todayISO = new Date().toISOString().split("T")[0];

  const [teaching, setTeaching] = useState<Teaching[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [branch, setBranch] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/teachers/me/classes", { credentials: "include" })
      .then((r) => r.ok ? r.json() : { teaching: [], subjects: [] })
      .then((data) => {
        const t: Teaching[] = data.teaching ?? [];
        const s: string[] = data.subjects ?? [];
        setTeaching(t);
        setSubjects(s);
        if (t.length === 1) {
          setBranch(t[0].branch);
          setYear(t[0].year);
          if (t[0].sections?.length === 1) setSection(t[0].sections[0]);
        }
        if (s.length === 1) setSubject(s[0]);
      })
      .catch(() => {});
  }, []);

  const branches = [...new Set(teaching.map((t) => t.branch))];
  const yearsForBranch = teaching.filter((t) => t.branch === branch).map((t) => t.year);
  const sectionsForClass = teaching.find((t) => t.branch === branch && t.year === year)?.sections ?? [];

  function handleBranchChange(v: string) { setBranch(v); setYear(""); setSection(""); setStudents([]); setSubmitted(false); }
  function handleYearChange(v: number) { setYear(v); setSection(""); setStudents([]); setSubmitted(false); }
  function handleSectionChange(v: string) { setSection(v); setStudents([]); setSubmitted(false); }

  function loadStudents() {
    if (!branch || !year || !section) return;
    setLoadingStudents(true);
    setSubmitted(false);
    setSubmitError("");
    fetch(`/api/students?branch=${branch}&year=${year}&section=${section}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((data: Student[]) => {
        setStudents(data);
        const init: Record<string, Status> = {};
        data.forEach((s) => { init[s._id] = "present"; });
        setAttendance(init);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }

  function toggle(id: string) {
    setAttendance((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  }

  async function handleSubmit() {
    if (!subject) { setSubmitError("Please select a subject before submitting."); return; }
    setSubmitting(true);
    setSubmitError("");
    const bulk = students.map((s) => ({ studentId: s._id, status: attendance[s._id] ?? "present" }));
    const res = await fetch("/api/attendance", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk, subject, date: todayISO }),
    });
    if (res.ok) setSubmitted(true);
    else setSubmitError("Failed to save attendance. Please try again.");
    setSubmitting(false);
  }

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Attendance</h1>
        <p className="text-blue-200 text-sm mt-1">{today}</p>
      </div>

      {/* Class + subject selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Select Class</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Branch</label>
            <select
              value={branch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Year</label>
            <select
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              disabled={!branch}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select</option>
              {yearsForBranch.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Section</label>
            <select
              value={section}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!year}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Select</option>
              {sectionsForClass.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={loadStudents}
            disabled={!branch || !year || !section || loadingStudents}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingStudents ? "Loading…" : "Load Students"}
          </button>
        </div>
      </div>

      {/* No teaching assigned */}
      {teaching.length === 0 && students.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 flex flex-col items-center justify-center gap-4 min-h-[200px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Users size={26} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-600">No classes assigned</p>
            <p className="text-sm text-gray-400 mt-1">Ask the admin to assign a class to your account.</p>
          </div>
        </div>
      )}

      {/* Student list */}
      {students.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">{students.length} students</span>
            <span className="text-xs text-gray-500">
              {presentCount} present · {students.length - presentCount} absent
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {students.map((student) => {
              const isPresent = attendance[student._id] === "present";
              return (
                <div key={student._id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.rollNumber}</p>
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
              <p className="text-xs text-green-600 font-semibold ml-auto">✓ Attendance saved for today</p>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Submit Attendance"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
