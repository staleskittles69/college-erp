"use client";

import { useEffect, useState } from "react";
import { Inbox, Send } from "lucide-react";

interface QueryItem {
  _id: string;
  subject: string;
  message: string;
  toRole: "admin" | "teacher";
  toName: string;
  status: "open" | "resolved" | "closed";
  reply?: string | null;
  createdAt: string;
}

function statusBadgeClass(status: QueryItem["status"]) {
  if (status === "open") return "bg-amber-100 text-amber-700";
  if (status === "resolved") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-600";
}

interface TeacherOption {
  userId: string;
  name: string;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function MessagesPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function fetchQueries() {
    return fetch("/api/queries", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setQueries)
      .catch(() => setQueries([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchQueries();
    fetch("/api/students/me/teachers", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setTeachers)
      .catch(() => setTeachers([]));
  }, []);

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/queries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          toTeacherUserId: recipient === "admin" ? undefined : recipient,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to send");
      setQueries((prev) => [body, ...prev]);
      setSubject("");
      setMessage("");
      setRecipient("admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">Queries</h1>
        <p className="text-white/80 text-sm mt-1">Send a query to the admin or a teacher and track its status here.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">New Query</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
          >
            <option value="admin">Admin</option>
            {teachers.map((teacher) => (
              <option key={teacher.userId} value={teacher.userId}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Missing marks for Data Structures"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your query…"
            required
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60"
        >
          <Send size={14} /> {submitting ? "Sending…" : "Send Query"}
        </button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Your Queries</h2>
        </div>
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : queries.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-4 min-h-[200px] text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Inbox size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">No queries sent yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queries.map((query) => (
              <li key={query._id} className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{query.subject}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(query.status)}`}>
                    {query.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  To: {query.toName} · {formatTimestamp(query.createdAt)}
                </p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{query.message}</p>
                {query.status === "resolved" && (
                  <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                    <p className="text-xs font-medium text-green-700 mb-1">Reply from {query.toName}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{query.reply}</p>
                    <p className="text-xs text-gray-400 italic mt-1">For further discussion, please meet the teacher in person.</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
