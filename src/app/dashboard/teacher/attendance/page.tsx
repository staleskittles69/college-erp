"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Student {
  _id: string;
  name: string;
  rollNo: string;
}

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetchError, setFetchError] = useState("");

  function loadStudents() {
    if (!subject) return;
    setFetchError("");
    fetch("/api/students", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Student[]) => {
        setStudents(data);
        const init: Record<string, "present" | "absent"> = {};
        data.forEach((s) => { init[s._id] = "present"; });
        setAttendance(init);
      })
      .catch(() => setFetchError("Failed to load students"));
  }

  function toggle(id: string) {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || students.length === 0) return;
    setLoading(true);
    setSaved(false);
    const bulk = students.map((s) => ({ studentId: s._id, status: attendance[s._id] }));
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subject, date, bulk }),
    });
    setLoading(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>

      <Card>
        <CardHeader><CardTitle>Session details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" onClick={loadStudents} disabled={!subject}>
            Load Students
          </Button>
          {fetchError && <p className="text-sm text-red-600">{fetchError}</p>}
        </CardContent>
      </Card>

      {students.length > 0 && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Students — {subject}</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-100">
                {students.map((s) => (
                  <li key={s._id} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-800">
                      {s.rollNo} — {s.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(s._id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        attendance[s._id] === "present"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {attendance[s._id] === "present" ? "Present" : "Absent"}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save Attendance"}
                </Button>
                {saved && <p className="text-sm text-green-600">Saved successfully!</p>}
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
