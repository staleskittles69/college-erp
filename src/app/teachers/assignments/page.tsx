"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, Plus, X, Upload, Paperclip } from "lucide-react";

interface Test {
  _id: string;
  subject: string;
  title: string;
  date: string;
  branch: string | null;
  semester: number | null;
  maxMarks: number | null;
  dueTime?: string | null;
  attachmentUrl?: string | null;
  testType?: string | null;
}

interface Dept { slug: string; name: string; }

const EMPTY_FORM = { title: "", subject: "", branch: "", semester: "", date: "", maxMarks: "", testType: "Assignment" };

export default function AssignmentsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function fetchTests() {
    return fetch("/api/tests", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setTests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTests();
    fetch("/api/departments", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then(setDepts)
      .catch(() => {});
    fetch("/api/teachers/me/classes", { credentials: "include" })
      .then((response) => response.ok ? response.json() : { subjects: [] })
      .then((classesData) => setSubjects(classesData.subjects ?? []))
      .catch(() => {});
  }, []);

  function handleBranchChange(value: string) { setForm((prev) => ({ ...prev, branch: value, semester: "" })); }

  async function handleCreate() {
    if (!form.title.trim() || !form.subject.trim() || !form.date) {
      setFormError("Title, subject, and due date are required.");
      return;
    }
    setSaving(true);
    setFormError("");

    let attachmentUrl: string | null = null;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        attachmentUrl = uploadResult.url;
      } else {
        setFormError("File upload failed. Try again.");
        setSaving(false);
        return;
      }
    }

    const response = await fetch("/api/tests", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        subject: form.subject.trim(),
        date: form.date,
        branch: form.branch || null,
        semester: form.semester ? Number(form.semester) : null,
        maxMarks: form.maxMarks ? Number(form.maxMarks) : null,
        testType: form.testType,
        attachmentUrl,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      setFormError(result.error ?? "Failed to create assignment.");
      setSaving(false);
      return;
    }

    setForm(EMPTY_FORM);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setOpen(false);
    setSaving(false);
    setLoading(true);
    setError(false);
    fetchTests();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <div>
          <h1 className="text-xl font-bold">Assignments</h1>
          <p className="text-white/80 text-sm mt-1">Tests and assignments for your classes</p>
        </div>
        <button
          onClick={() => { setOpen(true); setFormError(""); }}
          className="flex items-center gap-2 rounded-xl bg-white/15 border border-white/30 hover:bg-white/25 px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          <Plus size={16} /> Create
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Could not load assignments.
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 flex flex-col items-center justify-center gap-4 min-h-[300px] text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <ClipboardList size={26} className="text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-600">No assignments yet</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;Create Assignment&quot; to add one.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const dateStr = new Date(test.date).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            });
            return (
              <div key={test._id} className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{test.title}</p>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        test.testType === "Test" ? "bg-orange-50 text-orange-600" : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {test.testType === "Test" ? "Test" : "Assignment"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {test.subject}
                    {test.branch ? ` · ${test.branch}` : ""}
                    {test.semester ? ` · Year ${test.semester}` : ""}
                  </p>
                  {test.attachmentUrl && (
                    <a href={test.attachmentUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline mt-1">
                      <Paperclip size={11} /> Attachment
                    </a>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-600">{dateStr}</p>
                  {test.dueTime && <p className="text-xs text-gray-400">by {test.dueTime}</p>}
                  {test.maxMarks != null && <p className="text-xs text-gray-400">{test.maxMarks} marks</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Create {form.testType === "Test" ? "Test" : "Assignment"}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-2">
                  {(["Assignment", "Test"] as const).map((typeOption) => (
                    <button
                      key={typeOption}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, testType: typeOption }))}
                      className={`flex-1 text-sm font-medium rounded-lg px-3 py-2 border transition-colors ${
                        form.testType === typeOption
                          ? typeOption === "Test"
                            ? "bg-orange-50 border-orange-300 text-orange-700"
                            : "bg-amber-50 border-amber-300 text-amber-700"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {typeOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={form.testType === "Test" ? "e.g. Unit Test 2 - Data Structures" : "e.g. Chapter 3 Assignment"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject <span className="text-red-400">*</span></label>
                {subjects.length > 0 ? (
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
                  </select>
                ) : (
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Data Structures"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    value={form.branch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All branches</option>
                    {depts.map((dept) => <option key={dept.slug} value={dept.name}>{dept.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}
                    disabled={!form.branch}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="">{form.branch ? "All years" : "Select branch first"}</option>
                    {form.branch && [1, 2, 3, 4].map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Marks</label>
                <input
                  type="number"
                  value={form.maxMarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxMarks: e.target.value }))}
                  placeholder="e.g. 100"
                  min={0}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Attachment <span className="text-gray-400">(optional)</span></label>
                <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <Upload size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate">
                    {file ? file.name : "Click to upload a file"}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {file && (
                  <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-xs text-red-500 hover:text-red-700 mt-1">
                    Remove file
                  </button>
                )}
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Creating…" : `Create ${form.testType === "Test" ? "Test" : "Assignment"}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
