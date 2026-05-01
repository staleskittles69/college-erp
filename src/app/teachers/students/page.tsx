"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const branches = [
  { code: 'CSE', full: 'Computer Science & Engineering',          accent: 'border-l-blue-500',   icon: 'bg-blue-50 text-blue-600' },
  { code: 'ECE', full: 'Electronics & Communication Engineering', accent: 'border-l-green-500',  icon: 'bg-green-50 text-green-600' },
  { code: 'ME',  full: 'Mechanical Engineering',                  accent: 'border-l-amber-500',  icon: 'bg-amber-50 text-amber-600' },
  { code: 'CE',  full: 'Civil Engineering',                       accent: 'border-l-purple-500', icon: 'bg-purple-50 text-purple-600' },
  { code: 'EEE', full: 'Electrical & Electronics Engineering',    accent: 'border-l-rose-500',   icon: 'bg-rose-50 text-rose-600' },
];

export default function TeacherStudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Students</h1>
        <p className="text-sm text-gray-500 mt-1">Select a branch to view students</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {branches.map((branch) => (
          <Link
            key={branch.code}
            href={`/teachers/students/${branch.code.toLowerCase()}`}
            className={`rounded-xl border border-gray-200 bg-white p-5 border-l-4 ${branch.accent} flex items-center justify-between hover:shadow-md hover:scale-[1.02] transition-all`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${branch.icon}`}>
                {branch.code}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{branch.code}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{branch.full}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
