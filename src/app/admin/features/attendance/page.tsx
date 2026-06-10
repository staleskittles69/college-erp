"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface Dept { slug: string; name: string; }
interface Student { _id: string; name: string; rollNo: string; }
interface AttendanceRecord { studentId: string; subject: string; date: string; status: "present" | "absent"; }

export default function AttendancePage() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetch("/api/departments", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setDepts)
      .catch(() => {});
  }, []);

  async function handleApply() {
    if (!branch || !year || !section) return;
    setLoading(true);
    setApplied(false);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`/api/students?branch=${branch}&year=${year}&section=${encodeURIComponent(section)}`, { credentials: "include" }),
        fetch(`/api/attendance?branch=${branch}&section=${encodeURIComponent(section)}&from=${date}&to=${date}`, { credentials: "include" }),
      ]);
      const sData: Student[] = sRes.ok ? await sRes.json() : [];
      const aData: AttendanceRecord[] = aRes.ok ? await aRes.json() : [];
      setStudents([...sData].sort((a, b) => a.name.localeCompare(b.name)));
      setRecords(aData);
    } catch {}
    finally { setLoading(false); setApplied(true); }
  }

  // Map studentId → their records for the selected date
  const byStudent: Record<string, { present: number; absent: number; subjects: string[] }> = {};
  records.forEach((r) => {
    if (!byStudent[r.studentId]) byStudent[r.studentId] = { present: 0, absent: 0, subjects: [] };
    if (r.status === "present") byStudent[r.studentId].present++;
    else byStudent[r.studentId].absent++;
    if (!byStudent[r.studentId].subjects.includes(r.subject)) byStudent[r.studentId].subjects.push(r.subject);
  });

  const presentCount = students.filter((s) => (byStudent[s._id]?.present ?? 0) > 0).length;
  const absentCount = students.filter((s) => !byStudent[s._id] || byStudent[s._id].absent > 0).length;

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Attendance Management" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-sm text-gray-500 mt-1">View attendance records for a section on a specific date.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
          <select value={branch} onChange={(e) => { setBranch(e.target.value); setApplied(false); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">Select Branch</option>
            {depts.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
          <select value={year} onChange={(e) => { setYear(e.target.value); setApplied(false); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">Select Year</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
          <input value={section} onChange={(e) => { setSection(e.target.value); setApplied(false); }}
            placeholder="e.g. Section 1"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setApplied(false); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <button onClick={handleApply} disabled={loading || !branch || !year || !section}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50">
          {loading ? "Loading…" : "Apply Filters"}
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400 animate-pulse">
          Loading attendance…
        </div>
      )}

      {applied && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Total Students", value: students.length, color: "bg-gray-50 text-gray-700" },
              { label: "Present (any class)", value: presentCount, color: "bg-green-50 text-green-700" },
              { label: "Records Found", value: records.length, color: "bg-indigo-50 text-indigo-700" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                {branch} · Year {year} · {section} &nbsp;·&nbsp;{" "}
                {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </h3>
            </div>
            {students.length === 0 ? (
              <div className="px-6 py-10 text-sm text-gray-400 text-center">
                No students found for this selection.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects Marked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, i) => {
                    const rec = byStudent[s._id];
                    const hasRecord = !!rec;
                    const allPresent = rec && rec.absent === 0;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3.5 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-6 py-3.5 font-medium text-gray-800">{s.name}</td>
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{s.rollNo}</td>
                        <td className="px-6 py-3.5">
                          {!hasRecord ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Not marked</span>
                          ) : allPresent ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Present</span>
                          ) : rec.present > 0 ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Mixed</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">Absent</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-500">
                          {rec?.subjects.join(", ") || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {records.length === 0 && students.length > 0 && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              No attendance was recorded for this section on this date.
            </p>
          )}
        </>
      )}

      {!applied && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-sm text-gray-400">
          Select a branch, year, section, and date above then click Apply Filters.
        </div>
      )}
    </div>
  );
}
