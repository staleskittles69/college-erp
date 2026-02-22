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

interface TestItem {
  _id: string;
  subject: string;
  title: string;
  date: string;
  branch?: string;
  semester?: number;
  maxMarks?: number;
}

export function TestForm() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    subject: "",
    title: "",
    date: "",
    branch: "",
    semester: "",
    maxMarks: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/tests", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setTests)
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        subject: form.subject,
        title: form.title,
        date: form.date,
        branch: form.branch || undefined,
        semester: form.semester ? parseInt(form.semester, 10) : undefined,
        maxMarks: form.maxMarks ? parseInt(form.maxMarks, 10) : undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setForm({ subject: "", title: "", date: "", branch: "", semester: "", maxMarks: "" });
          load();
        }
      })
      .catch(() => setError("Request failed"))
      .finally(() => setSubmitting(false));
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this test?")) return;
    fetch(`/api/tests/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.ok && load())
      .catch(() => {});
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add test</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required
              />
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
              <Input
                label="Max marks (optional)"
                type="number"
                value={form.maxMarks}
                onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))}
              />
              <Input
                label="Branch (optional)"
                value={form.branch}
                onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
              />
              <Input
                label="Semester (optional)"
                type="number"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add test"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Title</Th>
                <Th>Subject</Th>
                <Th>Date</Th>
                <Th>{""}</Th>
              </TableHead>
              <TableBody>
                {tests.map((t) => (
                  <TableRow key={t._id}>
                    <Td>{t.title}</Td>
                    <Td>{t.subject}</Td>
                    <Td>{formatDate(t.date)}</Td>
                    <Td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(t._id)}
                      >
                        Delete
                      </Button>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && tests.length === 0 && (
            <p className="text-gray-500">No tests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
