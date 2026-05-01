"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, User, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudentResult {
  _id: string;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
}

function toStudentUrl(s: StudentResult) {
  const branch = s.branch.toLowerCase();
  const year = ["1st-year", "2nd-year", "3rd-year", "4th-year"][Math.ceil(s.semester / 2) - 1] ?? "1st-year";
  const section = s.section.toLowerCase().replace(/\s+/g, "-");
  return `/admin/${branch}/${year}/${section}/${s._id}`;
}

export default function AdminNavbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.email) setProfile({ name: data.name ?? "Admin", email: data.email }); })
      .catch(() => {});
  }, []);

  const fetchResults = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    fetch(`/api/students?search=${encodeURIComponent(q)}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setResults)
      .catch(() => setResults([]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(q), 300);
  }

  function handleSelect(s: StudentResult) {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    router.push(toStudentUrl(s));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && results.length > 0) handleSelect(results[0]);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-sm relative" ref={wrapperRef}>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name or roll no..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
          />
        </div>

        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            {results.map((s) => (
              <button
                key={s._id}
                onClick={() => handleSelect(s)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.rollNo} · {s.branch} · {s.section}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={15} className="text-indigo-600" />
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-sm font-semibold text-gray-800">{profile?.name ?? "Admin"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{profile?.email ?? "admin@college.edu"}</p>
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
