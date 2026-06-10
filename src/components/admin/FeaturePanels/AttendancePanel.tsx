"use client";

import { useEffect, useState } from "react";

interface AttendanceRecord {
  _id: string;
  subject: string;
  date: string;
  status: "present" | "absent";
}

interface AttendancePanelProps {
  studentId?: string;
  context?: string;
}

const EMPTY_FORM = {
  subject: "",
  date: new Date().toISOString().split("T")[0],
  status: "present" as "present" | "absent",
};

export default function AttendancePanel({ studentId = "", context }: AttendancePanelProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadRecords() {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/attendance?studentId=${studentId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadRecords(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Summary stats
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = total - present;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  // Group by subject
  const bySubject: Record<string, { present: number; total: number }> = {};
  records.forEach((r) => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, total: 0 };
    bySubject[r.subject].total += 1;
    if (r.status === "present") bySubject[r.subject].present += 1;
  });

  async function handleAdd() {
    if (!form.subject.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId,
          subject: form.subject.trim(),
          date: form.date,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
      } else {
        setShowForm(false);
        setForm(EMPTY_FORM);
        loadRecords();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">Attendance</h3>
          {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Mark Attendance
        </button>
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100">
          {[
            { label: "Present", value: present, color: "text-emerald-600 bg-emerald-50" },
            { label: "Absent", value: absent, color: "text-red-600 bg-red-50" },
            { label: "Overall", value: `${pct}%`, color: "text-indigo-600 bg-indigo-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg px-4 py-3 ${s.color}`}>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "present" | "absent" })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subject-wise summary table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : Object.keys(bySubject).length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No attendance records yet.</td></tr>
            ) : (
              Object.entries(bySubject).map(([subject, { present: p, total: t }]) => {
                const subPct = Math.round((p / t) * 100);
                const barColor = subPct >= 75 ? "bg-emerald-500" : subPct >= 50 ? "bg-yellow-500" : "bg-red-500";
                const pctColor = subPct >= 75 ? "text-emerald-600" : subPct >= 50 ? "text-yellow-600" : "text-red-500";
                return (
                  <tr key={subject} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800">{subject}</td>
                    <td className="px-6 py-3.5 text-gray-700">{p}</td>
                    <td className="px-6 py-3.5 text-gray-500">{t}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${subPct}%` }} />
                        </div>
                        <span className={`text-xs font-semibold w-10 ${pctColor}`}>{subPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-500">{total} record{total !== 1 ? "s" : ""} total</span>
      </div>
    </div>
  );
}
