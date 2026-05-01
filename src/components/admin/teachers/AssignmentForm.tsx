"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import { Assignment } from "@/lib/teachersData";

const BRANCHES: Assignment["branch"][] = ["CSE", "ECE", "MECH", "CIVIL"];
const YEARS: Assignment["year"][] = [1, 2, 3, 4];
const SECTIONS: ("A" | "B" | "C")[] = ["A", "B", "C"];

export default function AssignmentForm({ teacherId }: { teacherId: string }) {
  const { teachers, addAssignment } = useTeachers();
  const [branch, setBranch] = useState<Assignment["branch"]>("CSE");
  const [year, setYear] = useState<Assignment["year"]>(1);
  const [sections, setSections] = useState<("A" | "B" | "C")[]>([]);
  const [error, setError] = useState("");

  const teacher = teachers.find((t) => t.id === teacherId);
  const existingEntry = teacher?.teaching.find(
    (a) => a.branch === branch && a.year === year
  );
  const assignedSections = existingEntry?.sections ?? [];
  const allSectionsTaken = SECTIONS.every((s) => assignedSections.includes(s));

  function toggleSection(s: "A" | "B" | "C") {
    setSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sections.length === 0) { setError("Select at least one section."); return; }
    addAssignment(teacherId, { branch, year, sections });
    setSections([]);
    setError("");
  }

  const selectClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Branch</label>
          <select
            value={branch}
            onChange={(e) => { setBranch(e.target.value as Assignment["branch"]); setSections([]); setError(""); }}
            className={selectClass}
          >
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Year</label>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value) as Assignment["year"]); setSections([]); setError(""); }}
            className={selectClass}
          >
            {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Sections</label>
          {assignedSections.length > 0 && (
            <span className="text-[11px] text-gray-400">
              Assigned: {assignedSections.join(", ")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {SECTIONS.map((s) => {
            const isAssigned = assignedSections.includes(s);
            return (
              <button
                key={s}
                type="button"
                disabled={isAssigned}
                onClick={() => toggleSection(s)}
                title={isAssigned ? "Already assigned" : undefined}
                className={`w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-colors flex items-center justify-center ${
                  isAssigned
                    ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                    : sections.includes(s)
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {isAssigned ? <Check size={13} /> : s}
              </button>
            );
          })}
        </div>
        {allSectionsTaken && (
          <p className="text-xs text-amber-500 mt-1.5">All sections already assigned for this class.</p>
        )}
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={allSectionsTaken}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {existingEntry ? "Add Sections" : "Assign Class"}
      </button>
    </form>
  );
}
