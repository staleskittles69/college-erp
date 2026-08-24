"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { studentDetailUrl, yearLabel } from "@/lib/academics";
import { BacklogsTable } from "@/components/admin/AtRisk/BacklogsTable";
import { LowAttendanceTable } from "@/components/admin/AtRisk/LowAttendanceTable";

const TABS = [
  { id: "search", label: "Find a Student" },
  { id: "backlogs", label: "Backlogs" },
  { id: "attendance", label: "Low Attendance" },
] as const;

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
  year: number;
  section: string;
}

export default function StudentDataPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    fetch(`/api/students?search=${encodeURIComponent(searchQuery)}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Student[]) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => {
        setSearching(false);
        setHasSearched(true);
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "search" ? (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Find a Student</h3>
            <p className="text-sm text-gray-500 mb-4">Search by name or roll number to view their details.</p>
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or roll no..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
            </div>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="space-y-3">
              {searching ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  Searching…
                </div>
              ) : hasSearched && results.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No students match &quot;{query}&quot;.
                </div>
              ) : (
                results.map((student) => (
                  <Link
                    key={student._id}
                    href={studentDetailUrl(student)}
                    className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{student.rollNo}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{student.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">{student.branch}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">{yearLabel(student.year)}</span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{student.section}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      ) : tab === "backlogs" ? (
        <BacklogsTable />
      ) : (
        <LowAttendanceTable />
      )}
    </div>
  );
}
