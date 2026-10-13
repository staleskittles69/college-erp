"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, DoorOpen, Search, User } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { PermissionEntry } from "@/components/admin/FeaturePanels/PermissionsPanel";
import { studentDetailUrl, yearLabel } from "@/lib/academics";

interface StudentResult {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  branch: string;
  year: number;
  section: string;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function AdminPermissionsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyed by the student's id, so each search result keeps its own reason, error and confirmation.
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logged, setLogged] = useState<Record<string, { grantedAt: string; total: number }>>({});
  const [grantingId, setGrantingId] = useState("");

  const [today, setToday] = useState<PermissionEntry[]>([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [todayError, setTodayError] = useState("");

  const runSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    fetch(`/api/students?search=${encodeURIComponent(searchQuery.trim())}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: StudentResult[]) => setResults(data))
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

  function loadToday() {
    setTodayLoading(true);
    fetch("/api/admin/permissions", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { permissions: PermissionEntry[] } | null) => setToday(data?.permissions ?? []))
      .catch(() => setToday([]))
      .finally(() => setTodayLoading(false));
  }

  useEffect(() => { loadToday(); }, []);

  async function grant(student: StudentResult) {
    setGrantingId(student._id);
    setErrors((prev) => ({ ...prev, [student._id]: "" }));
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student._id, reason: reasons[student._id] ?? "" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors((prev) => ({ ...prev, [student._id]: result.error ?? "Something went wrong." }));
        return;
      }
      setLogged((prev) => ({ ...prev, [student._id]: { grantedAt: result.permission.grantedAt, total: result.total } }));
      setReasons((prev) => ({ ...prev, [student._id]: "" }));
      loadToday();
    } catch {
      setErrors((prev) => ({ ...prev, [student._id]: "Network error. Please try again." }));
    } finally {
      setGrantingId("");
    }
  }

  async function remove(entry: PermissionEntry) {
    if (!confirm(`Remove the campus exit logged for ${entry.studentName} at ${formatTime(entry.grantedAt)}?`)) return;
    setDeletingId(entry._id);
    setTodayError("");
    try {
      const response = await fetch(`/api/admin/permissions/${entry._id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setTodayError(result.error ?? "Could not remove this entry.");
        return;
      }
      // The "N exits in total" shown on their search result would now be one too high.
      setLogged((prev) => {
        const next = { ...prev };
        delete next[entry.userId];
        return next;
      });
      loadToday();
    } catch {
      setTodayError("Network error. Please try again.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Student Permissions" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Log a student leaving campus during the day. The time is recorded automatically and added to their record.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4" data-tour="permission-search">
        <h3 className="font-semibold text-gray-800 mb-1">Find the student</h3>
        <p className="text-sm text-gray-500 mb-4">Enter their roll number (a name works too).</p>
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 25CSE00601"
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </div>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="space-y-3 mb-6">
          {searching ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              Searching…
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              No students match &quot;{query}&quot;.
            </div>
          ) : (
            results.map((student) => {
              const done = logged[student._id];
              const error = errors[student._id];
              const granting = grantingId === student._id;
              return (
                <div key={student._id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{student.rollNo}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-medium">{student.branch}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">{yearLabel(student.year)}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{student.section}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <input
                          type="text"
                          value={reasons[student._id] ?? ""}
                          onChange={(e) => setReasons((prev) => ({ ...prev, [student._id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter" && !granting) grant(student); }}
                          maxLength={200}
                          placeholder="Reason (optional)"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                        />
                        <button
                          onClick={() => grant(student)}
                          disabled={granting}
                          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                        >
                          {granting ? "Logging..." : "Grant Permission"}
                        </button>
                      </div>

                      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                      {done && (
                        <p className="flex items-center gap-1.5 text-sm text-emerald-700 mt-2">
                          <CheckCircle2 size={15} />
                          Logged at {formatTime(done.grantedAt)} · {done.total} exit{done.total !== 1 ? "s" : ""} in total
                        </p>
                      )}
                      <Link
                        href={`${studentDetailUrl(student)}?tab=permissions`}
                        className="inline-block text-xs text-gray-500 hover:text-orange-600 mt-2"
                      >
                        View history →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Today's log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-tour="permissions-today">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Granted today</h3>
          {todayError && <p className="text-xs text-red-600 mt-1">{todayError}</p>}
        </div>
        {todayLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : today.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <DoorOpen size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No one has been let out today</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {today.map((entry) => (
              <li key={entry._id} className="px-6 py-3.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{formatTime(entry.grantedAt)}</span>
                    <span className="mx-2 text-gray-300">·</span>
                    {entry.studentName}
                    <span className="ml-2 text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{entry.rollNo}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.reason ? `${entry.reason} · ` : ""}Granted by {entry.grantedByName}
                  </p>
                </div>
                <button
                  onClick={() => remove(entry)}
                  disabled={deletingId === entry._id}
                  className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 flex-shrink-0"
                >
                  {deletingId === entry._id ? "Removing..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
