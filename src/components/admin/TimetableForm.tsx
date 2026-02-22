"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
];

interface Slot {
  subject: string;
  time: string;
  room: string;
}

interface TimetableRow {
  _id: string;
  branch: string;
  semester: number;
  section: string;
  dayOfWeek: number;
  slots: Slot[];
}

export function TimetableForm() {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Record<number, Slot[]>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    if (!branch || !semester || !section) return;
    setLoading(true);
    const params = new URLSearchParams({ branch, semester, section });
    fetch(`/api/timetable?${params}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setRows(data);
        const byDay: Record<number, Slot[]> = {};
        data.forEach((r: TimetableRow) => {
          byDay[r.dayOfWeek] = r.slots?.length ? [...r.slots] : [{ subject: "", time: "", room: "" }];
        });
        setEditing(byDay);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  function addSlot(day: number) {
    setEditing((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? [{ subject: "", time: "", room: "" }]), { subject: "", time: "", room: "" }],
    }));
  }

  function updateSlot(day: number, idx: number, field: keyof Slot, value: string) {
    setEditing((prev) => {
      const slots = [...(prev[day] ?? [])];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...prev, [day]: slots };
    });
  }

  function removeSlot(day: number, idx: number) {
    setEditing((prev) => {
      const slots = (prev[day] ?? []).filter((_, i) => i !== idx);
      return { ...prev, [day]: slots.length ? slots : [{ subject: "", time: "", room: "" }] };
    });
  }

  function saveDay(dayOfWeek: number) {
    const slots = (editing[dayOfWeek] ?? []).filter(
      (s) => s.subject.trim() && s.time.trim() && s.room.trim()
    );
    if (!branch || !semester || !section) {
      setMessage("Set branch, semester, section first.");
      return;
    }
    setSaving(true);
    setMessage("");
    fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        branch,
        semester: parseInt(semester, 10),
        section,
        dayOfWeek,
        slots: slots.length ? slots : [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setMessage(data.error);
        else {
          setMessage("Saved.");
          load();
        }
      })
      .catch(() => setMessage("Request failed"))
      .finally(() => setSaving(false));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add / Edit timetable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <Input
            label="Semester"
            type="number"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
          <Input
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={!branch || !semester || !section}>
          Load timetable
        </Button>
        {message && (
          <p className={`text-sm ${message === "Saved." ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
        {loading && <p className="text-gray-500">Loading…</p>}
        {!loading && (branch && semester && section) && (
          <div className="space-y-6">
            {DAYS.map(({ value: day, label }) => (
              <div key={day} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">{label}</h4>
                {(editing[day] ?? [{ subject: "", time: "", room: "" }]).map((slot, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-center mb-2">
                    <input
                      className="border rounded px-2 py-1 w-32 text-sm"
                      placeholder="Subject"
                      value={slot.subject}
                      onChange={(e) => updateSlot(day, idx, "subject", e.target.value)}
                    />
                    <input
                      className="border rounded px-2 py-1 w-28 text-sm"
                      placeholder="Time"
                      value={slot.time}
                      onChange={(e) => updateSlot(day, idx, "time", e.target.value)}
                    />
                    <input
                      className="border rounded px-2 py-1 w-24 text-sm"
                      placeholder="Room"
                      value={slot.room}
                      onChange={(e) => updateSlot(day, idx, "room", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlot(day, idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => addSlot(day)}>
                    Add slot
                  </Button>
                  <Button size="sm" onClick={() => saveDay(day)} disabled={saving}>
                    Save {label}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
