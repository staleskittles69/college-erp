"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import { Assignment } from "@/contexts/TeachersContext";

const BRANCHES: Assignment["branch"][] = ["CSE", "ECE", "MECH", "CIVIL"];
const YEARS: Assignment["year"][] = [1, 2, 3, 4];

export default function AssignmentForm({ teacherId }: { teacherId: string }) {
  const { teachers, addAssignment } = useTeachers();
  const [branch, setBranch] = useState<Assignment["branch"]>("CSE");
  const [year, setYear] = useState<Assignment["year"]>(1);
  const [sections, setSections] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingSections(true);
    setSections([]);
    fetch(`/api/admin/sections?branch=${branch}&year=${year}`, { credentials: "include" })
      .then((response) => response.json())
      .then((data: string[]) => setAvailableSections(Array.isArray(data) ? data : []))
      .catch(() => setAvailableSections([]))
      .finally(() => setLoadingSections(false));
  }, [branch, year]);

  const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
  const existingEntry = teacher?.teaching.find(
    (assignment) => assignment.branch === branch && assignment.year === year
  );
  const assignedSections = existingEntry?.sections ?? [];
  const allSectionsTaken = availableSections.length > 0 && availableSections.every((section) => assignedSections.includes(section));

  function toggleSection(section: string) {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]
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
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Branch</label>
          <select
            value={branch}
            onChange={(e) => { setBranch(e.target.value as Assignment["branch"]); setError(""); }}
            className={selectClass}
          >
            {BRANCHES.map((branchOption) => <option key={branchOption} value={branchOption}>{branchOption}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Year</label>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value) as Assignment["year"]); setError(""); }}
            className={selectClass}
          >
            {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
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
        {loadingSections ? (
          <p className="text-xs text-gray-400">Loading sections…</p>
        ) : availableSections.length === 0 ? (
          <p className="text-xs text-gray-400">No sections found for this branch/year.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableSections.map((section) => {
              const isAssigned = assignedSections.includes(section);
              return (
                <button
                  key={section}
                  type="button"
                  disabled={isAssigned}
                  onClick={() => toggleSection(section)}
                  title={isAssigned ? "Already assigned" : undefined}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-colors flex items-center justify-center ${
                    isAssigned
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                      : sections.includes(section)
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  {isAssigned ? <Check size={13} /> : section}
                </button>
              );
            })}
          </div>
        )}
        {allSectionsTaken && availableSections.length > 0 && (
          <p className="text-xs text-amber-500 mt-1.5">All sections already assigned for this class.</p>
        )}
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={allSectionsTaken}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {existingEntry ? "Add Sections" : "Assign Class"}
      </button>
    </form>
  );
}
