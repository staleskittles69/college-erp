"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTeachers } from "@/contexts/TeachersContext";
import { Assignment } from "@/contexts/TeachersContext";

const BRANCHES: Assignment["branch"][] = ["CSE", "ECE", "MECH", "CIVIL"];
const YEARS: Assignment["year"][] = [1, 2, 3, 4];

interface Props {
  teacherId: string;
  onClose: () => void;
}

export default function AssignClassModal({ teacherId, onClose }: Props) {
  const { teachers, addAssignment } = useTeachers();
  const [branch, setBranch] = useState<Assignment["branch"]>("CSE");
  const [year, setYear] = useState<Assignment["year"]>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const teacher = teachers.find((teacherItem) => teacherItem.id === teacherId);
  const existingEntry = teacher?.teaching.find((assignment) => assignment.branch === branch && assignment.year === year);
  const assignedSections = existingEntry?.sections ?? [];

  useEffect(() => {
    setLoadingSections(true);
    setSelected([]);
    fetch(`/api/admin/sections?branch=${branch}&year=${year}`, { credentials: "include" })
      .then((response) => response.json())
      .then((sectionsData: string[]) => {
        const sortedSections = Array.isArray(sectionsData) ? sectionsData : [];
        sortedSections.sort((sectionA, sectionB) => {
          const numA = parseInt(sectionA.replace(/\D/g, ""), 10);
          const numB = parseInt(sectionB.replace(/\D/g, ""), 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return sectionA.localeCompare(sectionB);
        });
        setAvailableSections(sortedSections);
      })
      .catch(() => setAvailableSections([]))
      .finally(() => setLoadingSections(false));
  }, [branch, year]);

  function toggle(section: string) {
    setSelected((prev) => prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]);
    setError("");
    setSuccess("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) { setError("Select at least one section."); return; }
    addAssignment(teacherId, { branch, year, sections: selected });
    setSelected([]);
    setSuccess(`Added: ${selected.join(", ")}`);
    setError("");
  }

  const selectClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Assign Class</h2>
            {teacher && <p className="text-xs text-gray-400 mt-0.5">{teacher.name}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Branch</label>
              <select value={branch} onChange={(e) => { setBranch(e.target.value as Assignment["branch"]); setError(""); setSuccess(""); }} className={selectClass}>
                {BRANCHES.map((branchOption) => <option key={branchOption} value={branchOption}>{branchOption}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Year</label>
              <select value={year} onChange={(e) => { setYear(Number(e.target.value) as Assignment["year"]); setError(""); setSuccess(""); }} className={selectClass}>
                {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>Year {yearOption}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2">
              <label className="text-xs font-medium text-gray-600">Sections</label>
            </div>

            {loadingSections ? (
              <p className="text-xs text-gray-400 py-2">Loading sections…</p>
            ) : availableSections.filter((section) => !assignedSections.includes(section)).length === 0 ? (
              <p className="text-xs text-gray-400 py-2">All sections already assigned for this branch / year.</p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {availableSections.filter((section) => !assignedSections.includes(section)).map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => toggle(section)}
                    className={`py-2 rounded-lg text-xs font-semibold border-2 transition-colors flex items-center justify-center ${
                      selected.includes(section)
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            {success && <p className="text-xs text-green-600 mt-2">{success}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Close
            </button>
            <button
              type="submit"
              disabled={loadingSections || availableSections.every((section) => assignedSections.includes(section))}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
