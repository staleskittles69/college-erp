"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface Teaching { branch: string; year: number; sections: string[]; }
interface Student { _id: string; name: string; rollNo: string; }
type Status = "present" | "absent";

export default function AttendancePage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

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
      .then((response) => response.ok ? response.json() : { teaching: [], subjects: [] })
      .then((classesData) => {
        const teachingList: Teaching[] = classesData.teaching ?? [];
        const subjectList: string[] = classesData.subjects ?? [];
        setTeaching(teachingList);
        setSubjects(subjectList);
        if (subjectList.length === 1) setSubject(subjectList[0]);
        if (teachingList.length === 1) {
          setBranch(teachingList[0].branch);
          setYear(teachingList[0].year);
          if (teachingList[0].sections?.length === 1) setSection(teachingList[0].sections[0]);
        }
      })
      .catch(() => {});
  }, []);

  const branches = [...new Set(teaching.map((teachingItem) => teachingItem.branch))];
  const yearsForBranch = teaching.filter((teachingItem) => teachingItem.branch === branch).map((teachingItem) => teachingItem.year);
  const sectionsForClass = teaching.find((teachingItem) => teachingItem.branch === branch && teachingItem.year === year)?.sections ?? [];

  function markAll(status: Status) {
    const next: Record<string, Status> = {};
    students.forEach((student) => { next[student._id] = status; });
    setAttendance(next);
  }

  useEffect(() => {
    if (!branch || !year || !section) { setStudents([]); setAttendance({}); return; }
    setLoadingStudents(true);
    setSubmitted(false);
    setSubmitError("");
    fetch(`/api/students?branch=${encodeURIComponent(branch)}&year=${year}&section=${encodeURIComponent(section)}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Student[]) => {
        const sorted = [...data].sort((studentA, studentB) => studentA.name.localeCompare(studentB.name));
        setStudents(sorted);
        const init: Record<string, Status> = {};
        sorted.forEach((student) => { init[student._id] = "present"; });
        setAttendance(init);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [branch, year, section]);

  function handleBranchChange(value: string) { setBranch(value); setYear(""); setSection(""); setSubmitted(false); }
  function handleYearChange(value: number) { setYear(value); setSection(""); setSubmitted(false); }
  function handleSectionChange(value: string) { setSection(value); setSubmitted(false); }

  function toggle(id: string) {
    setAttendance((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  }

  async function handleSubmit() {
    if (subjects.length > 0 && !subject) { setSubmitError("Please select a subject before submitting."); return; }
    setSubmitting(true);
    setSubmitError("");
    const bulk = students.map((student) => ({ studentId: student._id, status: attendance[student._id] ?? "present" }));
    const response = await fetch("/api/attendance", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk, subject, date }),
    });
    if (response.ok) setSubmitted(true);
    else setSubmitError("Failed to save attendance. Please try again.");
    setSubmitting(false);
  }

  const presentCount = Object.values(attendance).filter((status) => status === "present").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Attendance</h1>
        <p className="text-white/80 text-sm mt-1">{today}</p>
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select</option>
              {branches.map((branchOption) => <option key={branchOption} value={branchOption}>{branchOption}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Year</label>
            <select
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              disabled={!branch}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <option value="">Select</option>
              {yearsForBranch.map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Section</label>
            <select
              value={section}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!year}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <option value="">Select</option>
              {sectionsForClass.map((sectionOption) => <option key={sectionOption} value={sectionOption}>Section {sectionOption}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSubmitted(false); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        {loadingStudents && (
          <p className="mt-3 text-xs text-gray-400">Loading students…</p>
        )}
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
            <span className="text-sm font-semibold text-gray-700">
              {students.length} students &nbsp;·&nbsp; {presentCount} present &nbsp;·&nbsp; {students.length - presentCount} absent
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
            {students.map((student, index) => {
              const isPresent = attendance[student._id] === "present";
              return (
                <div key={student._id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-400">{index + 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-11 text-right ${isPresent ? "text-green-600" : "text-red-500"}`}>
                      {isPresent ? "Present" : "Absent"}
                    </span>
                    <button
                      onClick={() => toggle(student._id)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${isPresent ? "bg-green-500" : "bg-red-400"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isPresent ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
            {subjects.length > 1 && (
              <select
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setSubmitError(""); }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select subject</option>
                {subjects.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
              </select>
            )}
            {subjects.length === 1 && (
              <span className="flex-1 text-sm text-gray-700 font-medium px-1">{subject}</span>
            )}
            {submitError && <p className="text-xs text-red-500 shrink-0">{submitError}</p>}
            {submitted ? (
              <p className="text-xs text-green-600 font-semibold shrink-0">✓ Saved</p>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Submit"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
