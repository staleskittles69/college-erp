"use client";

import { useEffect, useState } from "react";
import { Inbox, Send, Check, RotateCcw } from "lucide-react";

interface QueryItem {
  _id: string;
  fromName?: string;
  fromRole?: "student" | "teacher";
  toName: string;
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
  const [sentQueries, setSentQueries] = useState<QueryItem[]>([]);
  const [receivedQueries, setReceivedQueries] = useState<QueryItem[]>([]);
  const [loadingSent, setLoadingSent] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function fetchSentQueries() {
    return fetch("/api/queries", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setSentQueries)
      .catch(() => setSentQueries([]))
      .finally(() => setLoadingSent(false));
  }

  function fetchReceivedQueries() {
    return fetch("/api/queries?box=received", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setReceivedQueries)
      .catch(() => setReceivedQueries([]))
      .finally(() => setLoadingReceived(false));
  }

  useEffect(() => {
    fetchSentQueries();
    fetchReceivedQueries();
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
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to send");
      setSentQueries((prev) => [body, ...prev]);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(query: QueryItem) {
    setUpdatingId(query._id);
    const nextStatus = query.status === "open" ? "resolved" : "open";
    const response = await fetch(`/api/queries/${query._id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) {
      setReceivedQueries((prev) =>
        prev.map((item) => (item._id === query._id ? { ...item, status: nextStatus } : item))
      );
    }
    setUpdatingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
          <Inbox size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Queries</h1>
          <p className="text-sm text-gray-500">Messages from students, and your own queries to admin</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Received from Students</h2>
        </div>
        {loadingReceived ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : receivedQueries.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-4 min-h-[160px] text-center">
            <Inbox size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No queries from students yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {receivedQueries.map((query) => (
              <li key={query._id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
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
                    <p className="text-xs text-gray-400 mt-0.5">
                      {query.fromName} · {formatTimestamp(query.createdAt)}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{query.message}</p>
                  </div>
                  <button
                    onClick={() => toggleStatus(query)}
                    disabled={updatingId === query._id}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      query.status === "open"
                        ? "text-green-700 border-green-200 hover:bg-green-50"
                        : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {query.status === "open" ? <><Check size={12} /> Resolve</> : <><RotateCcw size={12} /> Reopen</>}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 max-w-2xl">
        <h2 className="font-semibold text-gray-800">New Query to Admin</h2>
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
          <h2 className="font-semibold text-gray-800">Your Queries to Admin</h2>
        </div>
        {loadingSent ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : sentQueries.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center gap-4 min-h-[200px] text-center">
            <Inbox size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">No queries sent yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sentQueries.map((query) => (
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
