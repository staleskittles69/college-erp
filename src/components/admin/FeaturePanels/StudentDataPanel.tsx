"use client";

import { useEffect, useState } from "react";
import { BRANCHES } from "@/lib/academics";

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
  semester: number;
  section: string;
}

interface StudentDataPanelProps {
  context?: string;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const EMPTY_FORM = {
  name: "", rollNo: "", email: "", password: "", branch: "CSE", semester: 1, section: "1",
};

export default function StudentDataPanel({ context }: StudentDataPanelProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadStudents() {
    setLoading(true);
    try {
      const response = await fetch("/api/students", { credentials: "include" });
      if (response.ok) setStudents(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); }, []);

  async function handleAdd() {
    setError("");
    if (!form.name || !form.rollNo || !form.email || !form.password) {
      setError("Name, Roll No, Email and Password are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Failed to add student."); return; }
      setForm(EMPTY_FORM);
      await loadStudents();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = search
    ? students.filter((student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-5">
      {/* Add Student Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Add New Student</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Roll Number</label>
            <input
              type="text"
              value={form.rollNo}
              onChange={(e) => setForm((prev) => ({ ...prev, rollNo: e.target.value }))}
              placeholder="e.g. CS001"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="student@college.edu"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Login password"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
            <select
              value={form.branch}
              onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
            >
              {BRANCHES.map((branchOption) => <option key={branchOption}>{branchOption}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
            <select
              value={form.semester}
              onChange={(e) => setForm((prev) => ({ ...prev, semester: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
            >
              {SEMESTERS.map((semesterOption) => <option key={semesterOption} value={semesterOption}>Semester {semesterOption} (Year {Math.ceil(semesterOption / 2)})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
            <input
              type="number"
              min={1}
              value={form.section}
              onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {context && <p className="text-xs text-gray-400">Context: {context}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setForm(EMPTY_FORM); setError(""); }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add Student"}
            </button>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Student Records {!loading && <span className="text-gray-400 font-normal text-sm">({students.length})</span>}
          </h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll no..."
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-56"
          />
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-6 py-8 text-sm text-gray-400">Loading…</p>
          ) : filteredStudents.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400">
              {students.length === 0 ? "No students yet. Add one above." : "No students match your search."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sem</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{student.rollNo}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">{student.name}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.email}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.branch}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.semester}</td>
                    <td className="px-6 py-3.5 text-gray-600">{student.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
