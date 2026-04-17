"use client";

import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const students = [
  { name: 'Aarav Sharma',    roll: 'CS2101', course: 'B.Tech CSE', attendance: 92 },
  { name: 'Priya Patel',     roll: 'CS2102', course: 'B.Tech CSE', attendance: 85 },
  { name: 'Rohan Mehta',     roll: 'CS2103', course: 'B.Tech CSE', attendance: 78 },
  { name: 'Sneha Gupta',     roll: 'CS2104', course: 'B.Tech CSE', attendance: 96 },
  { name: 'Arjun Singh',     roll: 'IT2101', course: 'B.Tech IT',  attendance: 70 },
  { name: 'Divya Nair',      roll: 'IT2102', course: 'B.Tech IT',  attendance: 88 },
  { name: 'Karan Verma',     roll: 'IT2103', course: 'B.Tech IT',  attendance: 65 },
  { name: 'Meera Iyer',      roll: 'CS2105', course: 'B.Tech CSE', attendance: 91 },
  { name: 'Vikram Reddy',    roll: 'CS2106', course: 'B.Tech CSE', attendance: 83 },
  { name: 'Anjali Khanna',   roll: 'IT2104', course: 'B.Tech IT',  attendance: 74 },
];

function AttendanceBadge({ pct }: { pct: number }) {
  const color = pct >= 85 ? 'bg-green-100 text-green-700' : pct >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{pct}%</span>;
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Students</h1>
        <p className="text-blue-200 text-sm mt-1">View and manage your class roster</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Course <ChevronDown size={14} />
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Attendance <ChevronDown size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Roll No</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Course</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.roll} className={`hover:bg-gray-50 transition-colors ${i !== filtered.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-gray-900">{s.name}</td>
                <td className="px-5 py-3.5 text-gray-500 font-mono">{s.roll}</td>
                <td className="px-5 py-3.5 text-gray-600">{s.course}</td>
                <td className="px-5 py-3.5"><AttendanceBadge pct={s.attendance} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-400">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
