"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Pencil, Check, Loader2 } from "lucide-react";
import { DAYS, PERIODS, PERIOD_TIMES } from "@/lib/academics";
import Modal from "@/components/ui/Modal";

interface Assignment { branch: string; year: number; sections: string[]; }
interface ClassEntry {
  subject: string;
  period: number;
  time: string;
  room: string;
  branch: string;
  semester: number;
  section: string;
  dayOfWeek: number;
}
interface ClassOption { key: string; branch: string; semester: number; section: string; label: string; }

interface Props {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}

export default function TeacherTimetableModal({ teacherId, teacherName, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [teaching, setTeaching] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);

  const [editing, setEditing] = useState(false);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftClassKey, setDraftClassKey] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTimetable = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/admin/teachers/${teacherId}/timetable`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { teaching: Assignment[]; subjects: string[]; classes: ClassEntry[] }) => {
        setTeaching(data.teaching ?? []);
        setSubjects(data.subjects ?? []);
        setClasses(data.classes ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => { loadTimetable(); }, [loadTimetable]);

  const classOptions: ClassOption[] = teaching.flatMap((assignment) =>
    assignment.sections.map((section) => ({
      key: `${assignment.branch}|${assignment.year}|${section}`,
      branch: assignment.branch,
      semester: assignment.year,
      section,
      label: `${assignment.branch} · Year ${assignment.year} · ${section}`,
    }))
  );

  const cellMap = classes.reduce<Record<string, ClassEntry>>((acc, cls) => {
    acc[`${cls.dayOfWeek}-${cls.period}`] = cls;
    return acc;
  }, {});

  function openCell(day: number, period: number) {
    if (!editing || saving) return;
    const key = `${day}-${period}`;
    const existing = cellMap[key];
    setDraftSubject(existing?.subject ?? "");
    setDraftClassKey(existing ? `${existing.branch}|${existing.semester}|${existing.section}` : classOptions[0]?.key ?? "");
    setActiveCell(key);
  }

  async function saveCell(day: number, period: number) {
    const option = classOptions.find((opt) => opt.key === draftClassKey);
    if (!option) { setActiveCell(null); return; }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}/timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          branch: option.branch,
          semester: option.semester,
          section: option.section,
          dayOfWeek: day,
          period,
          subject: draftSubject,
          time: PERIOD_TIMES[period] ?? "",
        }),
      });
      if (response.ok) {
        setActiveCell(null);
        loadTimetable();
      }
    } finally {
      setSaving(false);
    }
  }

  const canEdit = classOptions.length > 0 && subjects.length > 0;

  return (
    <Modal
      title="Timetable"
      subtitle={teacherName}
      onClose={onClose}
      maxWidth="max-w-5xl"
      panelClassName="flex flex-col max-h-[90vh]"
      headerExtra={
        <button
          onClick={() => { setEditing((prev) => !prev); setActiveCell(null); }}
          disabled={!canEdit}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            editing
              ? "bg-orange-600 text-white border-orange-600"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {editing ? <><Check size={13} /> Done</> : <><Pencil size={13} /> Edit</>}
        </button>
      }
    >
        {/* Body */}
        <div className="overflow-auto p-6 flex-1">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((idx) => <div key={idx} className="h-10 bg-gray-100 rounded" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-gray-500 text-center py-8">Could not load this teacher&apos;s timetable.</p>
          ) : classOptions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No classes assigned yet. Use &quot;Assign Class&quot; to give {teacherName} a branch, year and section first.
            </p>
          ) : (
            <>
              {subjects.length === 0 && (
                <p className="text-xs text-amber-600 mb-3">
                  {teacherName} isn&apos;t linked to any subject yet in Subjects management — add one there to enable scheduling.
                </p>
              )}
              {editing && (
                <p className="text-xs text-gray-400 mb-3">Click any cell to edit. Clear the subject to remove that class.</p>
              )}
              <table className="w-full text-sm border-collapse min-w-[760px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4 w-28">Period</th>
                    {DAYS.map((day) => (
                      <th key={day} className="text-left text-xs text-gray-400 font-medium pb-2 px-2">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period} className="border-t border-gray-100">
                      <td className="py-2 pr-4 text-xs text-gray-400 whitespace-nowrap">
                        Period {period}
                        <span className="block text-[10px] text-gray-300">{PERIOD_TIMES[period]}</span>
                      </td>
                      {DAYS.map((day, dayIdx) => {
                        const key = `${dayIdx}-${period}`;
                        const entry = cellMap[key];
                        const isActive = activeCell === key;
                        return (
                          <td key={day} className="py-1.5 px-2 align-top">
                            {isActive ? (
                              <div className="space-y-1 min-w-[140px]">
                                {classOptions.length > 1 && (
                                  <select
                                    value={draftClassKey}
                                    onChange={(e) => setDraftClassKey(e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                  >
                                    {classOptions.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                                  </select>
                                )}
                                <select
                                  value={draftSubject}
                                  onChange={(e) => setDraftSubject(e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                >
                                  <option value="">— clear —</option>
                                  {subjects.map((subjectName) => <option key={subjectName} value={subjectName}>{subjectName}</option>)}
                                </select>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveCell(dayIdx, period)}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
                                  >
                                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  </button>
                                  <button
                                    onClick={() => setActiveCell(null)}
                                    disabled={saving}
                                    className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
                                  >
                                    <X size={12} className="mx-auto" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => openCell(dayIdx, period)}
                                disabled={!editing}
                                className={`w-full min-h-[44px] text-left rounded-md p-2 ${editing ? "hover:bg-orange-50 cursor-pointer" : "cursor-default"}`}
                              >
                                {entry ? (
                                  <span className="block bg-orange-50 text-orange-700 text-xs rounded-md px-2 py-1 leading-snug">
                                    {entry.subject}
                                    <span className="block text-[10px] text-orange-400">{entry.branch} · {entry.section}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-200 text-xs">—</span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
    </Modal>
  );
}
