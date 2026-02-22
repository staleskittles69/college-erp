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
  email?: string;
  name: string;
  rollNo: string;
  branch: string;
  semester: number;
  section: string;
}

export function StudentTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    rollNo: "",
    branch: "",
    semester: "",
    section: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    if (semester) params.set("semester", semester);
    fetch(`/api/students?${params}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        semester: form.semester ? parseInt(form.semester, 10) : undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setShowForm(false);
          setForm({
            email: "",
            password: "",
            name: "",
            rollNo: "",
            branch: "",
            semester: "",
            section: "",
          });
          load();
        } else {
          setError(data.error);
        }
      })
      .catch(() => setError("Request failed"))
      .finally(() => setSubmitting(false));
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this student? This will remove their account.")) return;
    fetch(`/api/students/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.ok && load())
      .catch(() => {});
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Students</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add student"}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label="Roll no"
                  value={form.rollNo}
                  onChange={(e) => setForm((f) => ({ ...f, rollNo: e.target.value }))}
                  required
                />
                <Input
                  label="Branch"
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  required
                />
                <Input
                  label="Semester"
                  type="number"
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                  required
                />
                <Input
                  label="Section"
                  value={form.section}
                  onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add student"}
              </Button>
            </form>
          )}

          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Filter by branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="Filter by semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="secondary" size="sm" onClick={load}>
              Apply
            </Button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Name</Th>
                <Th>Roll no</Th>
                <Th>Branch</Th>
                <Th>Semester</Th>
                <Th>Section</Th>
                <Th>{""}</Th>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s._id}>
                    <Td>{s.name}</Td>
                    <Td>{s.rollNo}</Td>
                    <Td>{s.branch}</Td>
                    <Td>{s.semester}</Td>
                    <Td>{s.section}</Td>
                    <Td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(s._id)}
                      >
                        Delete
                      </Button>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && students.length === 0 && (
            <p className="text-gray-500">No students found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
