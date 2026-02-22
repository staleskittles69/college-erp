"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
}

export function AttendanceForm() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [marks, setMarks] = useState<Record<string, "present" | "absent">>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/students", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    branch || semester || section
      ? students.filter((s) => {
          if (branch && s.branch !== branch) return false;
          if (semester && s.semester !== parseInt(semester, 10)) return false;
          if (section && s.section !== section) return false;
          return true;
        })
      : students;

  function handleMarkAll(status: "present" | "absent") {
    const next = { ...marks };
    filtered.forEach((s) => (next[s._id] = status));
    setMarks(next);
  }

  function handleSave() {
    if (!date || !subject) {
      setMessage("Set date and subject first.");
      return;
    }
    setSaving(true);
    setMessage("");
    const bulk = filtered.map((s) => ({
      studentId: s._id,
      status: marks[s._id] ?? "absent",
    }));
    fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ date, subject, bulk }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setMessage(data.error);
        else setMessage(`Saved attendance for ${data.count ?? bulk.length} students.`);
      })
      .catch(() => setMessage("Request failed"))
      .finally(() => setSaving(false));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add / Edit attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
          />
          <Input
            label="Branch (filter)"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <Input
            label="Semester (filter)"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
          <Input
            label="Section (filter)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>
        {message && (
          <p className={`text-sm ${message.startsWith("Saved") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleMarkAll("present")}>
            Mark all present
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleMarkAll("absent")}>
            Mark all absent
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save attendance"}
          </Button>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading students…</p>
        ) : (
          <Table>
            <TableHead>
              <Th>Name</Th>
              <Th>Roll no</Th>
              <Th>Status</Th>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s._id}>
                  <Td>{s.name}</Td>
                  <Td>{s.rollNo}</Td>
                  <Td>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={marks[s._id] ?? "absent"}
                      onChange={(e) =>
                        setMarks((m) => ({
                          ...m,
                          [s._id]: e.target.value as "present" | "absent",
                        }))
                      }
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-500">No students match filters. Add students first.</p>
        )}
      </CardContent>
    </Card>
  );
}
