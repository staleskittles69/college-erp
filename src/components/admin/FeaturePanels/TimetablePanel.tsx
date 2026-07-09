"use client";

import { useEffect, useState } from "react";
import { BRANCHES, DAYS, PERIODS, PERIOD_TIMES, SECTIONS, YEARS, yearLabel } from "@/lib/academics";
import { getSubjects } from "@/lib/subjects";

interface Slot { id: string; day: string; period: number; subject: string; }
interface TimetableRow { _id: string; dayOfWeek: number; slots: { subject: string; period?: number; time?: string; room?: string }[]; }

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics I": "bg-indigo-50 border-indigo-200 text-indigo-700",
  "Mathematics II": "bg-indigo-50 border-indigo-200 text-indigo-700",
  Physics: "bg-blue-50 border-blue-200 text-blue-700",
  Chemistry: "bg-purple-50 border-purple-200 text-purple-700",
  English: "bg-green-50 border-green-200 text-green-700",
  "Engineering Workshop": "bg-orange-50 border-orange-200 text-orange-700",
};

const DAY_INDEX: Record<string, number> = Object.fromEntries(DAYS.map((day, index) => [day, index]));
const EMPTY_FORM = { day: DAYS[0], period: PERIODS[0], subject: "" };

interface TimetablePanelProps { context?: string; }

export default function TimetablePanel({ context }: TimetablePanelProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [branch, setBranch] = useState(BRANCHES[0]);
  const [year, setYear] = useState(String(YEARS[0]));
  const [section, setSection] = useState(SECTIONS[0]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("");

  const subjectOptions = getSubjects(branch, year);

  useEffect(() => {
    if (showModal && form.subject && !subjectOptions.includes(form.subject)) {
      setForm((prev) => ({ ...prev, subject: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, year]);

  function openAdd() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openAddAt(day: string, period: number) { setEditingId(null); setForm({ day, period, subject: "" }); setShowModal(true); }
  function openEdit(slot: Slot) { setEditingId(slot.id); setForm({ day: slot.day, period: slot.period, subject: slot.subject }); setShowModal(true); }
  function handleDelete(id: string) { setSlots((prev) => prev.filter((slot) => slot.id !== id)); setShowModal(false); }

  function handleSave() {
    if (!form.subject.trim()) return;
    if (editingId) {
      setSlots((prev) => prev.map((slot) => (slot.id === editingId ? { ...slot, ...form } : slot)));
    } else {
      setSlots((prev) => [
        ...prev.filter((slot) => !(slot.day === form.day && slot.period === form.period)),
        { id: Date.now().toString(), ...form },
      ]);
    }
    setShowModal(false);
  }

  async function handleLoadFromDB() {
    setLoading(true);
    setSaveStatus("");
    try {
      const response = await fetch(
        `/api/timetable?branch=${branch}&semester=${year}&section=${section}`,
        { credentials: "include" }
      );
      if (!response.ok) return;
      const rows: TimetableRow[] = await response.json();
      const loaded: Slot[] = [];
      rows.forEach((row) => {
        const dayName = DAYS[row.dayOfWeek];
        if (!dayName) return;
        row.slots.forEach((slot, slotIndex) => {
          loaded.push({
            id: `${row._id}-${slotIndex}`,
            day: dayName,
            period: slot.period ?? slotIndex + 1,
            subject: slot.subject,
          });
        });
      });
      setSlots(loaded);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleSaveToDB() {
    if (slots.length === 0) return;
    setSaving(true);
    setSaveStatus("");
    const byDay: Record<number, Array<{ subject: string; period: number; time: string; room: string }>> = {};
    slots.forEach((slot) => {
      const dayIdx = DAY_INDEX[slot.day] ?? 0;
      if (!byDay[dayIdx]) byDay[dayIdx] = [];
      byDay[dayIdx].push({ subject: slot.subject, period: slot.period, time: PERIOD_TIMES[slot.period] ?? "", room: "" });
    });
    try {
      const results = await Promise.all(
        Object.entries(byDay).map(([dayIdx, daySlots]) =>
          fetch("/api/timetable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              branch: branch.toUpperCase(),
              semester: parseInt(year, 10),
              section: section.toUpperCase(),
              dayOfWeek: parseInt(dayIdx, 10),
              slots: daySlots,
            }),
          })
        )
      );
      setSaveStatus(results.every((result) => result.ok) ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">Timetable Editor</h3>
              {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
            </div>
            <button
              onClick={openAdd}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              + Add/Edit Slot
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              {BRANCHES.map((branchOption) => <option key={branchOption}>{branchOption}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              {YEARS.map((yearOption) => <option key={yearOption} value={yearOption}>{yearLabel(yearOption)}</option>)}
            </select>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              {SECTIONS.map((sectionOption) => <option key={sectionOption}>Section {sectionOption}</option>)}
            </select>
            <button onClick={handleLoadFromDB} disabled={loading}
              className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
              {loading ? "Loading…" : "Load from DB"}
            </button>
            <button onClick={handleSaveToDB} disabled={saving || slots.length === 0}
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-40">
              {saving ? "Saving…" : "Save to DB"}
            </button>
            {saveStatus === "saved" && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
            {saveStatus === "error" && <span className="text-xs text-red-600 font-medium">Error saving</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-2.5 bg-gray-50 border-b border-r border-gray-100 text-left w-28">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Day</span>
                </th>
                {PERIODS.map((period) => (
                  <th key={period} className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Period {period}</p>
                    <p className="text-[10px] text-gray-400 normal-case">{PERIOD_TIMES[period]}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-2 border-r border-gray-100 align-top">
                    <p className="text-xs font-semibold text-gray-600">{day}</p>
                  </td>
                  {PERIODS.map((period) => {
                    const slot = slots.find((s) => s.day === day && s.period === period);
                    return (
                      <td key={period} className="p-1.5 align-top">
                        <button
                          onClick={() => (slot ? openEdit(slot) : openAddAt(day, period))}
                          className={`w-full min-h-[56px] rounded-lg border text-xs text-left p-2 transition-colors ${
                            slot
                              ? `${SUBJECT_COLORS[slot.subject] ?? "bg-gray-50 border-gray-200 text-gray-700"} hover:opacity-80`
                              : "border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400"
                          }`}
                        >
                          {slot ? <span className="font-semibold leading-snug">{slot.subject}</span> : <span>+ Add</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {slots.length === 0 && !loading && (
          <div className="px-6 py-8 text-center text-sm text-gray-400 border-t border-gray-100">
            Select a class above and click &quot;Load from DB&quot;, or click any empty period to add a slot.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">{editingId ? "Edit Slot" : "Add Slot"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600">
                  {DAYS.map((dayOption) => <option key={dayOption}>{dayOption}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
                <select value={form.period} onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600">
                  {PERIODS.map((periodOption) => <option key={periodOption} value={periodOption}>Period {periodOption} ({PERIOD_TIMES[periodOption]})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600">
                  <option value="">Select subject…</option>
                  {subjectOptions.map((subjectOption) => <option key={subjectOption} value={subjectOption}>{subjectOption}</option>)}
                </select>
                {subjectOptions.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">No subjects mapped for {branch} · {yearLabel(year)} yet.</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              {editingId ? (
                <button onClick={() => handleDelete(editingId)}
                  className="px-3 py-2 text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={!form.subject.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50">
                  {editingId ? "Save Changes" : "Add Slot"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
