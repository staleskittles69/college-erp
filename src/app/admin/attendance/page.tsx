"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { localDateISO } from "@/lib/utils";
import { PERIODS, PERIOD_TIMES } from "@/lib/academics";

interface Branch { slug: string; name: string; label: string; }
interface Student { _id: string; name: string; rollNo: string; }
interface SavedRecord { studentId: string; status: Status; }
type Status = "present" | "absent";

export default function AdminAttendancePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [section, setSection] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [subject, setSubject] = useState("");
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [period, setPeriod] = useState<number | "">("");
  const [date, setDate] = useState(() => localDateISO());

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [alreadySaved, setAlreadySaved] = useState(false);
  // Bumped on every load and selection change, so a slow response for an old selection is ignored.
  const loadIdRef = useRef(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/departments", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Branch[]) => setBranches(data))
      .catch(() => {});
  }, []);

  // Subjects come from the real Subject collection for this branch's department.
  useEffect(() => {
    setSubject("");
    const department = branches.find((branchOption) => branchOption.name === branch)?.slug;
    if (!department) { setSubjectOptions([]); return; }
    fetch(`/api/admin/subjects?department=${encodeURIComponent(department)}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: { name: string }[]) => setSubjectOptions(data.map((subjectItem) => subjectItem.name)))
      .catch(() => setSubjectOptions([]));
  }, [branch, branches]);

  // Sections are fetched from actual enrolled students for this branch/year, not typed by hand.
  useEffect(() => {
    setSection("");
    if (!branch || !year) { setSections([]); return; }
    setLoadingSections(true);
    fetch(`/api/admin/sections?branch=${encodeURIComponent(branch)}&year=${year}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: string[]) => setSections(data))
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));
  }, [branch, year]);

  // The list on screen belongs to one class, subject, period and date — changing any of them clears it.
  function clearList() {
    loadIdRef.current += 1;
    setStudents([]);
    setAlreadySaved(false);
    setLoadingStudents(false);
    setLoadError("");
    setSubmitted(false);
  }
  function handleBranchChange(value: string) { setBranch(value); clearList(); }
  function handleYearChange(value: number | "") { setYear(value); clearList(); }
  function handleSectionChange(value: string) { setSection(value); clearList(); }

  // Loads the class together with anything already saved for this subject, period and date, so
  // re-saving keeps earlier absences instead of resetting everyone to present.
  function loadStudents() {
    if (!branch || !year || !section || !subject || !period) return;
    const loadId = ++loadIdRef.current;
    setLoadingStudents(true);
    setLoadError("");
    setSubmitted(false);
    setSubmitError("");
    const classQuery = `branch=${encodeURIComponent(branch)}&year=${year}&section=${encodeURIComponent(section)}`;
    const getJson = (url: string) =>
      fetch(url, { credentials: "include" }).then((response) => response.ok ? response.json() : Promise.reject());
    Promise.all([
      getJson(`/api/students?${classQuery}`),
      getJson(`/api/attendance?${classQuery}&subject=${encodeURIComponent(subject)}&period=${period}&from=${date}&to=${date}`),
    ])
      .then(([data, savedRecords]: [Student[], SavedRecord[]]) => {
        if (loadId !== loadIdRef.current) return;
        const saved = new Map(savedRecords.map((record) => [record.studentId, record.status]));
        const init: Record<string, Status> = {};
        data.forEach((student) => { init[student._id] = saved.get(student._id) ?? "present"; });
        setStudents(data);
        setAttendance(init);
        setAlreadySaved(saved.size > 0);
      })
      .catch(() => {
        if (loadId !== loadIdRef.current) return;
        setStudents([]);
        setLoadError("Couldn't load this class. Please try again.");
      })
      .finally(() => { if (loadId === loadIdRef.current) setLoadingStudents(false); });
  }

  function toggle(id: string) {
    setAttendance((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
    setSubmitted(false);
  }

  function markAll(status: Status) {
    const next: Record<string, Status> = {};
    students.forEach((student) => { next[student._id] = status; });
    setAttendance(next);
    setSubmitted(false);
  }

  async function handleSubmit() {
    if (!subject.trim() || !period) { setSubmitError("Select a subject and period before submitting."); return; }
    setSubmitting(true);
    setSubmitError("");
    const bulk = students.map((student) => ({ studentId: student._id, status: attendance[student._id] ?? "present" }));
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk, subject: subject.trim(), date, period }),
      });
      if (response.ok) {
        setSubmitted(true);
        setAlreadySaved(true);
      } else {
        const result = await response.json().catch(() => ({}));
        setSubmitError(result.error ?? "Failed to save. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = Object.values(attendance).filter((status) => status === "present").length;
  const absentCount = students.length - presentCount;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select a class, subject, period and date, then mark students.</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4" data-tour="attendance-filters">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
            <select
              value={branch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select</option>
              {branches.map((branchOption) => (
                <option key={branchOption.slug} value={branchOption.name}>{branchOption.label || branchOption.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value ? Number(e.target.value) : "")}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              disabled={!branch || !year || loadingSections}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">
                {!branch || !year ? "Select branch & year first" : loadingSections ? "Loading…" : sections.length === 0 ? "No sections found" : "Select"}
              </option>
              {sections.map((sectionOption) => (
                <option key={sectionOption} value={sectionOption}>{sectionOption}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadStudents}
              disabled={!branch || !year || !section || !subject || !period || loadingStudents}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {loadingStudents ? <RefreshCw size={14} className="animate-spin" /> : null}
              Load Students
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => { setSubject(e.target.value); clearList(); }}
              disabled={subjectOptions.length === 0}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">
                {!branch ? "Select branch first" : subjectOptions.length === 0 ? "No subjects found" : "Select subject"}
              </option>
              {subjectOptions.map((subjectOption) => (
                <option key={subjectOption} value={subjectOption}>{subjectOption}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => { setPeriod(e.target.value ? Number(e.target.value) : ""); clearList(); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select</option>
              {PERIODS.map((periodOption) => (
                <option key={periodOption} value={periodOption}>Period {periodOption} ({PERIOD_TIMES[periodOption]})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); clearList(); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        {loadError && <p className="text-xs text-red-500">{loadError}</p>}
        {alreadySaved && !submitted && students.length > 0 && (
          <p className="text-xs text-amber-700">
            Attendance was already taken for this period. It&apos;s shown below — saving again updates it.
          </p>
        )}
      </div>

      {/* Student list */}
      {students.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" data-tour="attendance-list">
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

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4" data-tour="attendance-submit">
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            {submitted ? (
              <p className="text-xs text-green-600 font-semibold ml-auto">✓ Attendance saved</p>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving…" : alreadySaved ? "Save Changes" : "Submit Attendance"}
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
