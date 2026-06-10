"use client";

import { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_INDEX: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5,
};

interface Slot { id: string; day: string; subject: string; time: string; room: string; }
interface TimetableRow { _id: string; dayOfWeek: number; slots: { subject: string; time: string; room: string }[]; }

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-indigo-50 border-indigo-200 text-indigo-700",
  Physics: "bg-blue-50 border-blue-200 text-blue-700",
  "Physics Lab": "bg-blue-50 border-blue-200 text-blue-700",
  Chemistry: "bg-purple-50 border-purple-200 text-purple-700",
  English: "bg-green-50 border-green-200 text-green-700",
  "Computer Lab": "bg-orange-50 border-orange-200 text-orange-700",
};

const EMPTY_FORM = { day: "Monday", subject: "", time: "", room: "" };

interface TimetablePanelProps { context?: string; }

export default function TimetablePanel({ context }: TimetablePanelProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("1");
  const [section, setSection] = useState("A");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("");

  function openAdd() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(slot: Slot) { setEditingId(slot.id); setForm({ day: slot.day, subject: slot.subject, time: slot.time, room: slot.room }); setShowModal(true); }
  function handleDelete(id: string) { setSlots((prev) => prev.filter((s) => s.id !== id)); }

  function handleSave() {
    if (!form.subject.trim() || !form.time.trim() || !form.room.trim()) return;
    if (editingId) {
      setSlots((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...form } : s)));
    } else {
      setSlots((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setShowModal(false);
  }

  async function handleLoadFromDB() {
    setLoading(true);
    setSaveStatus("");
    try {
      const res = await fetch(
        `/api/timetable?branch=${branch}&semester=${year}&section=${section}`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const rows: TimetableRow[] = await res.json();
      const loaded: Slot[] = [];
      rows.forEach((row) => {
        const dayName = DAYS[row.dayOfWeek];
        if (!dayName) return;
        row.slots.forEach((slot, i) => {
          loaded.push({ id: `${row._id}-${i}`, day: dayName, subject: slot.subject, time: slot.time, room: slot.room });
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
    const byDay: Record<number, Array<{ subject: string; time: string; room: string }>> = {};
    slots.forEach((s) => {
      const dayIdx = DAY_INDEX[s.day] ?? 0;
      if (!byDay[dayIdx]) byDay[dayIdx] = [];
      byDay[dayIdx].push({ subject: s.subject, time: s.time, room: s.room });
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
      setSaveStatus(results.every((r) => r.ok) ? "saved" : "error");
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
              + Add Slot
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              {["CSE", "ECE", "ME", "CE", "EEE"].map((b) => <option key={b}>{b}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              {["1", "2", "3", "4"].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <select value={section} onChange={(e) => setSection(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              {["A", "B", "C", "D"].map((s) => <option key={s}>Section {s}</option>)}
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
          <div className="min-w-[800px] grid grid-cols-6 divide-x divide-gray-100">
            {DAYS.map((day) => (
              <div key={day}>
                <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-center">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{day.slice(0, 3)}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {slots.filter((s) => s.day === day).map((slot) => (
                    <div key={slot.id}
                      className={`border rounded-lg p-2.5 text-xs group relative cursor-default ${SUBJECT_COLORS[slot.subject] ?? "bg-gray-50 border-gray-200 text-gray-700"}`}>
                      <p className="font-semibold leading-snug">{slot.subject}</p>
                      <p className="opacity-70 mt-0.5">{slot.time}</p>
                      <p className="opacity-60 mt-0.5">{slot.room}</p>
                      <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                        <button onClick={() => openEdit(slot)} className="text-[9px] text-gray-400 hover:text-gray-600 font-medium">✎</button>
                        <button onClick={() => handleDelete(slot.id)} className="text-[9px] text-gray-400 hover:text-red-500 font-medium">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {slots.length === 0 && !loading && (
          <div className="px-6 py-8 text-center text-sm text-gray-400 border-t border-gray-100">
            Select a class above and click &quot;Load from DB&quot;, or add slots manually.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">{editingId ? "Edit Slot" : "Add New Slot"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600">
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                <input type="text" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="e.g. 9:00 – 10:00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                <input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="e.g. Room 101"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                {editingId ? "Save Changes" : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
