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

interface NoticeItem {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export function NoticeForm() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/notices", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setNotices)
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setForm({ title: "", body: "", pinned: false });
          load();
        }
      })
      .catch(() => setError("Request failed"))
      .finally(() => setSubmitting(false));
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    fetch(`/api/notices/${id}`, {
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
          <CardTitle>Post notice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Pinned</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Posting…" : "Post notice"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <Table>
              <TableHead>
                <Th>Title</Th>
                <Th>Pinned</Th>
                <Th>Date</Th>
                <Th>{""}</Th>
              </TableHead>
              <TableBody>
                {notices.map((n) => (
                  <TableRow key={n._id}>
                    <Td>{n.title}</Td>
                    <Td>{n.pinned ? "Yes" : "No"}</Td>
                    <Td>{formatDate(n.createdAt)}</Td>
                    <Td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(n._id)}
                      >
                        Delete
                      </Button>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && notices.length === 0 && (
            <p className="text-gray-500">No notices yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
