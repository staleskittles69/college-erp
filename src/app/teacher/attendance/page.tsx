"use client";

import { useState } from 'react';
import { Save } from 'lucide-react';

const initialStudents = [
  { roll: 'CS2101', name: 'Aarav Sharma' },
  { roll: 'CS2102', name: 'Priya Patel' },
  { roll: 'CS2103', name: 'Rohan Mehta' },
  { roll: 'CS2104', name: 'Sneha Gupta' },
  { roll: 'CS2105', name: 'Meera Iyer' },
  { roll: 'CS2106', name: 'Vikram Reddy' },
  { roll: 'IT2101', name: 'Arjun Singh' },
  { roll: 'IT2102', name: 'Divya Nair' },
  { roll: 'IT2103', name: 'Karan Verma' },
  { roll: 'IT2104', name: 'Anjali Khanna' },
];

type Status = 'present' | 'absent';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Record<string, Status>>(
    Object.fromEntries(initialStudents.map((s) => [s.roll, 'present']))
  );

  const toggle = (roll: string) =>
    setAttendance((prev) => ({ ...prev, [roll]: prev[roll] === 'present' ? 'absent' : 'present' }));

  const presentCount = Object.values(attendance).filter((v) => v === 'present').length;

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Attendance</h1>
        <p className="text-blue-200 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Summary + Save */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Present: {presentCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            Absent: {initialStudents.length - presentCount}
          </span>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Save size={15} />
          Save Attendance
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">#</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Roll No</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Name</th>
              <th className="text-left px-5 py-3.5 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {initialStudents.map((s, i) => {
              const status = attendance[s.roll];
              return (
                <tr key={s.roll} className={`hover:bg-gray-50 transition-colors ${i !== initialStudents.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3.5 font-mono text-gray-500">{s.roll}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggle(s.roll)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        status === 'present'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {status === 'present' ? 'Present' : 'Absent'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
