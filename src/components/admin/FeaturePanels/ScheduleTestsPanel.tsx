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
  seriesId: string | null;
  seriesLabel: string | null;
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

interface DraftRow {
  key: string;
  subject: string;
  title: string;
  titleAuto: boolean;
  date: string;
  dueTime: string;
  maxMarks: string;
  notes: string;
}

function makeRow(defaults: { dueTime: string; maxMarks: string }): DraftRow {
  return {
    key: Math.random().toString(36).slice(2),
    subject: "",
    title: "",
    titleAuto: true,
    date: "",
    dueTime: defaults.dueTime,
    maxMarks: defaults.maxMarks,
    notes: "",
  };
}

function suggestTitle(testType: string, subject: string) {
  return subject ? `${testType} - ${subject}` : "";
}

function suggestSeriesLabel(testType: string, branch: string, semester: string) {
  return `${testType} — ${branch} ${yearLabel(semester)}`;
}

function formatDate(dateString: string) {
  try { return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateString; }
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const selectClass = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20";
const rowInputClass = "w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

export default function ScheduleTestsPanel() {
  const { data: tests, loading, refetch: fetchTests } = useFetch<Test[]>("/api/tests", []);
  const [mode, setMode] = useState<"single" | "multiple">("single");

  // ---- single-test mode (unchanged behavior) ----
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

  // ---- multiple-tests mode ----
  const [bulkBranch, setBulkBranch] = useState(BRANCHES[0]);
  const [bulkSemester, setBulkSemester] = useState(String(YEARS[0]));
  const [bulkTestType, setBulkTestType] = useState(TEST_TYPES[0]);
  const [seriesLabel, setSeriesLabel] = useState(() => suggestSeriesLabel(TEST_TYPES[0], BRANCHES[0], String(YEARS[0])));
  const [seriesLabelTouched, setSeriesLabelTouched] = useState(false);
  const [defaultDueTime, setDefaultDueTime] = useState("");
  const [defaultMaxMarks, setDefaultMaxMarks] = useState("");
  const [rows, setRows] = useState<DraftRow[]>(() => [makeRow({ dueTime: "", maxMarks: "" }), makeRow({ dueTime: "", maxMarks: "" })]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const bulkSubjectOptions = getSubjects(bulkBranch, bulkSemester);

  useEffect(() => {
    if (!seriesLabelTouched) setSeriesLabel(suggestSeriesLabel(bulkTestType, bulkBranch, bulkSemester));
  }, [bulkTestType, bulkBranch, bulkSemester, seriesLabelTouched]);

  useEffect(() => {
    setRows((prev) =>
      prev.map((row) =>
        row.subject && !bulkSubjectOptions.includes(row.subject)
          ? { ...row, subject: "", title: row.titleAuto ? "" : row.title }
          : row
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkBranch, bulkSemester]);

  function addRow() {
    setRows((prev) => [...prev, makeRow({ dueTime: defaultDueTime, maxMarks: defaultMaxMarks })]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleRowSubjectChange(key: string, subject: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, subject, title: row.titleAuto ? suggestTitle(bulkTestType, subject) : row.title } : row
      )
    );
  }

  function handleRowTitleChange(key: string, title: string) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, title, titleAuto: false } : row)));
  }

  function resetBulkForm() {
    setRows([makeRow({ dueTime: "", maxMarks: "" }), makeRow({ dueTime: "", maxMarks: "" })]);
    setDefaultDueTime("");
    setDefaultMaxMarks("");
    setSeriesLabelTouched(false);
  }

  async function handleBulkSave() {
    setBulkError("");
    if (!bulkBranch || !bulkSemester || !bulkTestType) {
      setBulkError("Branch, year and test type are required.");
      return;
    }
    for (const row of rows) {
      if (!row.subject || !row.date) {
        setBulkError("Every row needs a subject and a date.");
        return;
      }
      if (row.dueTime.trim() && !isValidTestTime(row.dueTime)) {
        setBulkError("Time / Period must look like '10:00 AM' or 'Period 3'.");
        return;
      }
    }
    const hasPastDate = rows.some((row) => row.date < todayString());
    if (hasPastDate && !confirm("One or more dates are in the past — those tests will be logged as already having happened. Schedule anyway?")) {
      return;
    }

    setBulkSaving(true);
    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: rows.map((row) => ({
            subject: row.subject,
            title: row.title.trim() || undefined,
            date: row.date,
            dueTime: row.dueTime.trim() || null,
            maxMarks: row.maxMarks ? Number(row.maxMarks) : null,
            notes: row.notes.trim() || null,
          })),
          branch: bulkBranch,
          semester: Number(bulkSemester),
          testType: bulkTestType,
          seriesLabel: seriesLabel.trim(),
        }),
      });
      const responseBody = await response.json();
      if (!response.ok) throw new Error(responseBody.error ?? "Failed to schedule tests.");
      resetBulkForm();
      fetchTests();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBulkSaving(false);
    }
  }

  // ---- series grouping for the list below (derived from the flat test list, no extra fetch) ----
  const seriesGroups = Array.from(
    tests.reduce((map, test) => {
      if (!test.seriesId) return map;
      const entry = map.get(test.seriesId) ?? { label: test.seriesLabel ?? "Test Series", count: 0 };
      entry.count += 1;
      map.set(test.seriesId, entry);
      return map;
    }, new Map<string, { label: string; count: number }>())
  );

  const [deletingSeries, setDeletingSeries] = useState<string | null>(null);

  async function handleDeleteSeries(seriesId: string, label: string) {
    if (!confirm(`Delete all tests in "${label}"? This cannot be undone.`)) return;
    setDeletingSeries(seriesId);
    await fetch(`/api/tests/series/${seriesId}`, { method: "DELETE", credentials: "include" });
    setDeletingSeries(null);
    fetchTests();
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            {editingId ? "Edit Test" : mode === "single" ? "Schedule New Test" : "Schedule Multiple Tests"}
          </h3>
          {!editingId && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === "single" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Single Test
              </button>
              <button
                type="button"
                onClick={() => setMode("multiple")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === "multiple" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Multiple Tests
              </button>
            </div>
          )}
        </div>

        {mode === "single" || editingId ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Branch</label>
                <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className={selectClass}>
                  {BRANCHES.map((branchOption) => <option key={branchOption}>{branchOption}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Year</label>
                <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className={selectClass}>
                  {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>{yearLabel(yearOption)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Section</label>
                <input type="number" min={1} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className={selectClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Subject</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={selectClass}>
                  <option value="">Select subject…</option>
                  {subjectOptions.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Test Type</label>
                <select value={form.testType} onChange={(e) => setForm({ ...form, testType: e.target.value })} className={selectClass}>
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
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${inputClass} text-gray-600`} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Time / Period</label>
                <input type="text" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} placeholder="e.g. 10:00 AM or Period 3" className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Max Marks</label>
                <input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} placeholder="e.g. 50" className={inputClass} />
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
                  <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
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
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 -mt-1">
              For tests scheduled together across a whole year (e.g. mid-exams) — no section, since these apply year-wide.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Branch</label>
                <select value={bulkBranch} onChange={(e) => setBulkBranch(e.target.value)} className={selectClass}>
                  {BRANCHES.map((branchOption) => <option key={branchOption}>{branchOption}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Year</label>
                <select value={bulkSemester} onChange={(e) => setBulkSemester(e.target.value)} className={selectClass}>
                  {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>{yearLabel(yearOption)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Test Type</label>
                <select value={bulkTestType} onChange={(e) => setBulkTestType(e.target.value)} className={selectClass}>
                  {TEST_TYPES.map((typeOption) => <option key={typeOption}>{typeOption}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Series Label</label>
              <input
                type="text"
                value={seriesLabel}
                onChange={(e) => { setSeriesLabel(e.target.value); setSeriesLabelTouched(true); }}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Default Time / Period (optional)</label>
                <input type="text" value={defaultDueTime} onChange={(e) => setDefaultDueTime(e.target.value)} placeholder="e.g. 10:00 AM or Period 3" className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Default Max Marks (optional)</label>
                <input type="number" value={defaultMaxMarks} onChange={(e) => setDefaultMaxMarks(e.target.value)} placeholder="e.g. 50" className={inputClass} />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Marks</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td className="px-3 py-2 min-w-[9rem]">
                        <select value={row.subject} onChange={(e) => handleRowSubjectChange(row.key, e.target.value)} className={rowInputClass}>
                          <option value="">Select…</option>
                          {bulkSubjectOptions.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 min-w-[12rem]">
                        <input type="text" value={row.title} onChange={(e) => handleRowTitleChange(row.key, e.target.value)} placeholder="Auto-filled from subject" className={rowInputClass} />
                      </td>
                      <td className="px-3 py-2 min-w-[9rem]">
                        <input type="date" value={row.date} onChange={(e) => updateRow(row.key, { date: e.target.value })} className={`${rowInputClass} text-gray-600`} />
                      </td>
                      <td className="px-3 py-2 min-w-[7rem]">
                        <input type="text" value={row.dueTime} onChange={(e) => updateRow(row.key, { dueTime: e.target.value })} placeholder="10:00 AM" className={rowInputClass} />
                      </td>
                      <td className="px-3 py-2 min-w-[5rem]">
                        <input type="number" value={row.maxMarks} onChange={(e) => updateRow(row.key, { maxMarks: e.target.value })} placeholder="50" className={rowInputClass} />
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={rows.length === 1}
                          className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={addRow} className="text-xs font-medium text-orange-600 hover:text-orange-700">
              + Add Row
            </button>

            <div className="flex items-center gap-3">
              {bulkError && <p className="text-xs text-red-500">{bulkError}</p>}
              <div className="ml-auto">
                <button
                  onClick={handleBulkSave}
                  disabled={bulkSaving}
                  className="px-5 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-60"
                >
                  {bulkSaving ? "Scheduling…" : `Schedule All (${rows.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Scheduled Tests</h3>
          {!loading && <span className="text-xs text-gray-400">{tests.length} total</span>}
        </div>

        {seriesGroups.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50/60">
            {seriesGroups.map(([seriesId, info]) => (
              <div key={seriesId} className="flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-medium pl-3 pr-2 py-1.5 rounded-full">
                <span>{info.label} ({info.count})</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSeries(seriesId, info.label)}
                  disabled={deletingSeries === seriesId}
                  className="text-orange-400 hover:text-red-600 disabled:opacity-40"
                >
                  {deletingSeries === seriesId ? "…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}

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
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Series</th>
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
                    <td className="px-4 py-3 text-gray-500">{test.seriesLabel ?? "—"}</td>
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
