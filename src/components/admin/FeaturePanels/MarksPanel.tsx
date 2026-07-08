"use client";

import { useEffect, useState } from "react";

interface MarkRecord {
  id: string;
  subject: string;
  examType: string;
  obtained: number;
  max: number;
}

interface MarksPanelProps {
  studentId?: string;
  context?: string;
}

const EMPTY_FORM = { subject: "", examType: "Mid Term", obtained: "", max: "100" };

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  A: "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-blue-50 text-blue-600",
  "C+": "bg-yellow-100 text-yellow-700",
  C: "bg-orange-100 text-orange-700",
  D: "bg-red-100 text-red-700",
};

function calcGrade(obtained: number, max: number) {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  return "D";
}

export default function MarksPanel({ studentId = "", context }: MarksPanelProps) {
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadMarks() {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/admin/marks?studentId=${studentId}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setMarks)
      .catch(() => setMarks([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMarks();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!form.subject.trim() || !form.obtained || !form.max) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId,
          subject: form.subject.trim(),
          examType: form.examType,
          obtained: Number(form.obtained),
          max: Number(form.max),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error ?? "Failed to save");
      } else {
        setShowForm(false);
        setForm(EMPTY_FORM);
        loadMarks();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/marks?id=${id}`, { method: "DELETE", credentials: "include" });
    loadMarks();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">Marks</h3>
          {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + Add Marks
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="sm:col-span-2">
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Exam Type</label>
              <select
                value={form.examType}
                onChange={(e) => setForm({ ...form, examType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600"
              >
                <option>Mid Term</option>
                <option>Final</option>
                <option>Assignment</option>
                <option>Quiz</option>
                <option>Practical</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Obtained</label>
                <input
                  type="number"
                  value={form.obtained}
                  onChange={(e) => setForm({ ...form, obtained: e.target.value })}
                  placeholder="75"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Max</label>
                <input
                  type="number"
                  value={form.max}
                  onChange={(e) => setForm({ ...form, max: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : marks.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No marks added yet.</td></tr>
            ) : (
              marks.map((row) => {
                const grade = calcGrade(row.obtained, row.max);
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-800">{row.subject}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{row.examType}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-gray-800 font-medium">{row.obtained}</span>
                      <span className="text-gray-400">/{row.max}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${GRADE_COLORS[grade] ?? "bg-gray-100 text-gray-600"}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">{marks.length} record{marks.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
