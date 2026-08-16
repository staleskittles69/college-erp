"use client";

import { useEffect, useState } from "react";
import { BRANCHES, TEST_TYPES, YEARS, yearLabel } from "@/lib/academics";
import { getSubjects } from "@/lib/subjects";
import { isValidTestTime } from "@/lib/utils";
import { useFetch } from "@/hooks/useFetch";

interface Test {
  _id: string;
  subject: string;
  title: string;
  date: string;
  branch: string | null;
  semester: number | null;
  section: string | null;
  testType: string | null;
  maxMarks: number | null;
  dueTime: string | null;
  notes: string | null;
}

const EMPTY_FORM = {
  branch: BRANCHES[0],
  semester: String(YEARS[0]),
  section: "1",
  subject: "",
  title: "",
  testType: TEST_TYPES[0],
  date: "",
  dueTime: "",
  maxMarks: "",
  notes: "",
};

function formatDate(dateString: string) {
  try { return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateString; }
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ScheduleTestsPanel() {
  const { data: tests, loading, refetch: fetchTests } = useFetch<Test[]>("/api/tests", []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const subjectOptions = getSubjects(form.branch, form.semester);

  useEffect(() => {
    if (form.subject && !subjectOptions.includes(form.subject)) {
      setForm((prev) => ({ ...prev, subject: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.branch, form.semester]);

  function resetForm() { setForm(EMPTY_FORM); setEditingId(null); }

  function openEdit(test: Test) {
    setEditingId(test._id);
    setForm({
      branch: test.branch ?? BRANCHES[0],
      semester: test.semester != null ? String(test.semester) : String(YEARS[0]),
      section: test.section ? test.section.replace(/^Section\s*/i, "") : "1",
      subject: test.subject,
      title: test.title,
      testType: test.testType ?? TEST_TYPES[0],
      date: test.date ? test.date.slice(0, 10) : "",
      dueTime: test.dueTime ?? "",
      maxMarks: test.maxMarks != null ? String(test.maxMarks) : "",
      notes: test.notes ?? "",
    });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.subject || !form.date) {
      setError("Title, subject and date are required.");
      return;
    }
    if (form.dueTime.trim() && !isValidTestTime(form.dueTime)) {
      setError("Time / Period must look like '10:00 AM' or 'Period 3'.");
      return;
    }
    if (form.date < todayString() && !confirm("This date is in the past — the test will be logged as already having happened. Schedule it anyway?")) {
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      subject: form.subject,
      title: form.title.trim(),
      date: form.date,
      branch: form.branch,
      semester: Number(form.semester),
      section: form.section ? `Section ${form.section}` : null,
      testType: form.testType,
      maxMarks: form.maxMarks ? Number(form.maxMarks) : null,
      dueTime: form.dueTime || null,
      notes: form.notes.trim() || null,
    };
    const response = await fetch(editingId ? `/api/tests/${editingId}` : "/api/tests", {
      method: editingId ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error ?? "Failed to save test.");
    } else {
      resetForm();
      fetchTests();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scheduled test?")) return;
    setDeleting(id);
    await fetch(`/api/tests/${id}`, { method: "DELETE", credentials: "include" });
    setDeleting(null);
    fetchTests();
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">{editingId ? "Edit Test" : "Schedule New Test"}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Branch</label>
              <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                {BRANCHES.map((branchOption) => <option key={branchOption}>{branchOption}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Year</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>{yearLabel(yearOption)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Section</label>
              <input type="number" min={1} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                <option value="">Select subject…</option>
                {subjectOptions.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Test Type</label>
              <select value={form.testType} onChange={(e) => setForm({ ...form, testType: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                {TEST_TYPES.map((typeOption) => <option key={typeOption}>{typeOption}</option>)}
              </select>
            </div>
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Test title, e.g. Unit Test 1 - Data Structures"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-600" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Time / Period</label>
              <input type="text" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                placeholder="e.g. 10:00 AM or Period 3"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Max Marks</label>
              <input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
          </div>

          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional syllabus / notes..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />

          <div className="flex items-center gap-3">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="ml-auto flex items-center gap-2">
              {editingId && (
                <button onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Schedule Test"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Scheduled Tests</h3>
          {!loading && <span className="text-xs text-gray-400">{tests.length} total</span>}
        </div>
        {loading ? (
          <div className="px-6 py-10 text-sm text-gray-400 text-center">Loading…</div>
        ) : tests.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-400 text-center">No tests scheduled yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Section</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Marks</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{test.title}</td>
                    <td className="px-4 py-3 text-gray-600">{test.branch ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{test.semester ? yearLabel(test.semester) : "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{test.section ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{test.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(test.date)}</td>
                    <td className="px-4 py-3 text-gray-600">{test.dueTime ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{test.maxMarks ?? "—"}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(test)}
                        className="text-xs text-orange-600 hover:text-orange-800 font-medium mr-3">Edit</button>
                      <button onClick={() => handleDelete(test._id)} disabled={deleting === test._id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40">
                        {deleting === test._id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
