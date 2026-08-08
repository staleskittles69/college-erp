"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, User, LogOut, Search, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { studentDetailUrl } from "@/lib/academics";
import Link from "next/link";

interface AdminNavbarProps {
  onMenuClick: () => void;
}

interface StudentResult {
  _id: string;
  name: string;
  rollNo: string;
  branch: string;
  year: number;
  section: string;
}

export default function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [openQueryCount, setOpenQueryCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((profileData) => { if (profileData?.email) setProfile({ name: profileData.name ?? "Admin", email: profileData.email }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/queries?status=open", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setOpenQueryCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  const fetchResults = useCallback((searchQuery: string) => {
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
    debounceRef.current = setTimeout(() => fetchResults(searchQuery), 300);
  }

  function handleSelect(student: StudentResult) {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    router.push(studentDetailUrl(student));
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 gap-3 flex-shrink-0 z-10">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="md:hidden -ml-1 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

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
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {results.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleSelect(student)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {student.rollNo} · {student.branch} · {student.section}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <Link
          href="/admin/queries"
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title={openQueryCount > 0 ? `${openQueryCount} open ${openQueryCount === 1 ? "query" : "queries"}` : "Queries"}
        >
          <Bell size={18} />
          {openQueryCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full">
              {openQueryCount > 9 ? "9+" : openQueryCount}
            </span>
          )}
        </Link>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <User size={15} className="text-orange-600" />
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
