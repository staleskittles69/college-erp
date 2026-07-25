"use client";

import { useState, useCallback, useRef } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import MarksPanel from "@/components/admin/FeaturePanels/MarksPanel";

interface StudentResult {
  _id: string;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
}

export default function MarksPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selected, setSelected] = useState<StudentResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    fetch(`/api/students?search=${encodeURIComponent(searchQuery)}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then(setResults)
      .catch(() => setResults([]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const searchQuery = e.target.value;
    setQuery(searchQuery);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(searchQuery), 300);
  }

  function handleSelect(student: StudentResult) {
    setSelected(student);
    setQuery(student.name);
    setResults([]);
    setShowDropdown(false);
  }

  const context = selected
    ? `${selected.branch} · Semester ${selected.semester} · ${selected.section}`
    : undefined;

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Marks Management" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marks Management</h1>
        <p className="text-sm text-gray-500 mt-1">Search for a student to view and manage their marks.</p>
      </div>

      {/* Student Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <label className="block text-xs font-medium text-gray-700 mb-2">Search Student</label>
        <div className="relative max-w-sm">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setShowDropdown(true)}
            placeholder="Name or roll number…"
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {results.map((student) => (
                <button key={student._id} onClick={() => handleSelect(student)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <p className="text-sm font-medium text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{student.rollNo} · {student.branch} · Sem {student.semester}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <p className="mt-2 text-xs text-gray-500">
            Showing marks for <strong>{selected.name}</strong> ({context})
            <button onClick={() => { setSelected(null); setQuery(""); }}
              className="ml-2 text-orange-600 hover:text-orange-800 underline">
              Clear
            </button>
          </p>
        )}
      </div>

      {selected ? (
        <MarksPanel studentId={selected._id} context={`${selected.name} · ${context}`} />
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center text-sm text-gray-400">
          Search for a student above to view and manage their marks.
        </div>
      )}
    </div>
  );
}
