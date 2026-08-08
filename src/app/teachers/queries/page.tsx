"use client";

import { useEffect, useState } from "react";
import { Inbox, Send } from "lucide-react";

interface QueryItem {
  _id: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function TeacherQueriesPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function fetchQueries() {
    return fetch("/api/queries", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setQueries)
      .catch(() => setQueries([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchQueries(); }, []);

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
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to send");
      setQueries((prev) => [body, ...prev]);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
          <Inbox size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Queries</h1>
          <p className="text-sm text-gray-500">Send a query to the admin and track its status</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 max-w-2xl">
        <h2 className="font-semibold text-gray-800">New Query</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Timetable clash for CSE Year 2"
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

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Your Queries</h2>
        </div>
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : queries.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-4 min-h-[200px] text-center">
            <Inbox size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No queries sent yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queries.map((query) => (
              <li key={query._id} className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{query.subject}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      query.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {query.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatTimestamp(query.createdAt)}</p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{query.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
