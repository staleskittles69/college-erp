"use client";

import { useEffect, useState, useRef } from "react";
import { Library, Plus, Upload, FileText, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useFetch } from "@/hooks/useFetch";

interface Resource {
  _id: string;
  title: string;
  subject: string;
  branch: string;
  year: number;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

interface Teaching { branch: string; year: number; sections: string[]; }

const EMPTY_FORM = { title: "", subject: "", branch: "", year: "" };

function formatDate(dateString: string) {
  try { return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return dateString; }
}

export default function TeacherResourcesPage() {
  const { data: resources, loading, refetch: fetchResources, setData: setResources } = useFetch<Resource[]>("/api/resources", []);
  const [teaching, setTeaching] = useState<Teaching[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/teachers/me/classes", { credentials: "include" })
      .then((response) => response.ok ? response.json() : { teaching: [], subjects: [] })
      .then((classesData) => {
        setTeaching(classesData.teaching ?? []);
        setSubjects(classesData.subjects ?? []);
      })
      .catch(() => {});
  }, []);

  const branches = [...new Set(teaching.map((teachingItem) => teachingItem.branch))];
  const yearsForBranch = teaching.filter((teachingItem) => teachingItem.branch === form.branch).map((teachingItem) => teachingItem.year);

  function handleBranchChange(value: string) { setForm((prev) => ({ ...prev, branch: value, year: "" })); }

  async function handleUpload() {
    if (!form.title.trim() || !form.subject.trim() || !form.branch || !form.year) {
      setFormError("Title, subject, branch, and year are required.");
      return;
    }
    if (!file) {
      setFormError("Choose a file to upload.");
      return;
    }
    setSaving(true);
    setFormError("");

    const formData = new FormData();
    formData.append("file", file);
    const uploadResponse = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
    if (!uploadResponse.ok) {
      setFormError("File upload failed. Try again.");
      setSaving(false);
      return;
    }
    const uploadResult = await uploadResponse.json();

    const response = await fetch("/api/resources", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        subject: form.subject.trim(),
        branch: form.branch,
        year: Number(form.year),
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      setFormError(result.error ?? "Failed to save resource.");
      setSaving(false);
      return;
    }

    setForm(EMPTY_FORM);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setOpen(false);
    setSaving(false);
    fetchResources();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resource? This cannot be undone.")) return;
    setDeleting(id);
    const response = await fetch(`/api/resources/${id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      setResources((prev) => prev.filter((resource) => resource._id !== id));
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-white/80 text-sm mt-1">Share notes, PDFs, and study materials with your students.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-white text-orange-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <Plus size={16} /> Upload
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((skeletonIdx) => (
            <div key={skeletonIdx} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Library size={26} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">No resources uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload notes and study materials for your students.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {resources.map((resource) => (
            <li key={resource._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center justify-between gap-4">
              <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{resource.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{resource.subject} · {resource.branch} · Year {resource.year} · {formatDate(resource.createdAt)}</p>
                </div>
              </a>
              <button
                onClick={() => handleDelete(resource._id)}
                disabled={deleting === resource._id}
                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Delete resource"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal title="Upload Resource" onClose={() => setOpen(false)} maxWidth="max-w-lg">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Unit 3 Notes - Data Structures"
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
                  placeholder="Subject name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Branch <span className="text-red-400">*</span></label>
                <select
                  value={form.branch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select branch</option>
                  {branches.map((branchOption) => <option key={branchOption} value={branchOption}>{branchOption}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year <span className="text-red-400">*</span></label>
                <select
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                  disabled={!form.branch}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="">{form.branch ? "Select year" : "Select branch first"}</option>
                  {yearsForBranch.map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">File <span className="text-red-400">*</span></label>
              <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-500 cursor-pointer hover:border-orange-400 hover:text-orange-600 transition-colors">
                <Upload size={15} />
                {file ? file.name : "Choose a file (max 10MB)"}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg">Cancel</button>
            <button
              onClick={handleUpload}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Uploading…" : "Upload"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
