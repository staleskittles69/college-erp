"use client";

import { useState } from "react";
import { X, Pencil, Check } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM"];

const INITIAL_TIMETABLE: Record<string, string> = {
  "Monday-9:00 AM":    "Data Structures (CSE-A)",
  "Monday-11:00 AM":   "Algorithms (CSE-B)",
  "Tuesday-10:00 AM":  "DBMS (ECE-A)",
  "Wednesday-9:00 AM": "Data Structures (CSE-B)",
  "Wednesday-2:00 PM": "Algorithms (CSE-A)",
  "Thursday-11:00 AM": "DBMS (CSE-A)",
  "Friday-9:00 AM":    "Data Structures (CSE-A)",
  "Friday-3:00 PM":    "Algorithms (ECE-B)",
};

interface Props {
  teacherName: string;
  onClose: () => void;
}

export default function TeacherTimetableModal({ teacherName, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [timetable, setTimetable] = useState<Record<string, string>>(INITIAL_TIMETABLE);
  const [activeCell, setActiveCell] = useState<string | null>(null);

  function handleCellChange(key: string, value: string) {
    setTimetable((prev) => ({ ...prev, [key]: value }));
  }

  function handleCellBlur(key: string, value: string) {
    setActiveCell(null);
    if (!value.trim()) {
      setTimetable((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Timetable</h2>
            <p className="text-xs text-gray-400 mt-0.5">{teacherName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing((prev) => !prev); setActiveCell(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                editing
                  ? "bg-orange-600 text-white border-orange-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {editing ? <><Check size={13} /> Done</> : <><Pencil size={13} /> Edit</>}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Timetable grid */}
        <div className="overflow-auto p-6 flex-1">
          {editing && (
            <p className="text-xs text-gray-400 mb-3">Click any cell to edit. Clear a cell to remove the entry.</p>
          )}
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4 w-24">Time</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period} className="border-t border-gray-100">
                  <td className="py-2 pr-4 text-xs text-gray-400 whitespace-nowrap">{period}</td>
                  {DAYS.map((day) => {
                    const key = `${day}-${period}`;
                    const value = timetable[key] ?? "";
                    return (
                      <td key={day} className="py-1.5 px-2">
                        {editing ? (
                          <input
                            type="text"
                            value={activeCell === key ? value : value}
                            placeholder="—"
                            onFocus={() => setActiveCell(key)}
                            onChange={(e) => handleCellChange(key, e.target.value)}
                            onBlur={(e) => handleCellBlur(key, e.target.value)}
                            className="w-full min-w-[100px] px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder-gray-300"
                          />
                        ) : value ? (
                          <span className="inline-block bg-orange-50 text-orange-700 text-xs rounded-md px-2 py-1 leading-snug whitespace-nowrap">
                            {value}
                          </span>
                        ) : (
                          <span className="text-gray-200 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-[11px] text-gray-400">
            Timetable changes are saved locally. Database persistence will be added in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
