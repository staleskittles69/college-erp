"use client";

import { useEffect, useState } from "react";
import { Inbox, Send, Check, RotateCcw, X } from "lucide-react";

interface QueryItem {
  _id: string;
  fromName?: string;
  fromRole?: "student" | "teacher";
  toName: string;
  subject: string;
  message: string;
  status: "open" | "resolved" | "closed";
  reply?: string | null;
  createdAt: string;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function statusBadgeClass(status: QueryItem["status"]) {
  if (status === "open") return "bg-amber-100 text-amber-700";
  if (status === "resolved") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-600";
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
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

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

  async function resolveQuery(query: QueryItem) {
    const reply = (replyDrafts[query._id] ?? "").trim();
    if (!reply) {
      setActionError((prev) => ({ ...prev, [query._id]: "Enter a reply before resolving." }));
      return;
    }
    setUpdatingId(query._id);
    setActionError((prev) => ({ ...prev, [query._id]: "" }));
    const response = await fetch(`/api/queries/${query._id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved", reply }),
    });
    if (response.ok) {
      setReceivedQueries((prev) =>
        prev.map((item) => (item._id === query._id ? { ...item, status: "resolved", reply } : item))
      );
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[query._id];
        return next;
      });
    } else {
      const body = await response.json().catch(() => ({}));
      setActionError((prev) => ({ ...prev, [query._id]: body.error ?? "Failed to resolve." }));
    }
    setUpdatingId(null);
  }

  async function setQueryStatus(query: QueryItem, status: "open" | "closed") {
    setUpdatingId(query._id);
    const response = await fetch(`/api/queries/${query._id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setReceivedQueries((prev) =>
        prev.map((item) => (item._id === query._id ? { ...item, status } : item))
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
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{query.subject}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(query.status)}`}>
                      {query.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {query.fromName} · {formatTimestamp(query.createdAt)}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{query.message}</p>

                  {query.status === "open" && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyDrafts[query._id] ?? ""}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [query._id]: e.target.value }))}
                        placeholder="Type your reply…"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
                      />
                      {actionError[query._id] && <p className="text-xs text-red-500">{actionError[query._id]}</p>}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolveQuery(query)}
                          disabled={updatingId === query._id}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border text-green-700 border-green-200 hover:bg-green-50 disabled:opacity-50"
                        >
                          <Check size={12} /> Resolve
                        </button>
                        <button
                          onClick={() => setQueryStatus(query, "closed")}
                          disabled={updatingId === query._id}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <X size={12} /> Close
                        </button>
                      </div>
                    </div>
                  )}

                  {query.status === "resolved" && (
                    <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{query.reply}</p>
                      <p className="text-xs text-gray-400 italic mt-1">For further discussion, please meet the teacher in person.</p>
                      <button
                        onClick={() => setQueryStatus(query, "open")}
                        disabled={updatingId === query._id}
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <RotateCcw size={12} /> Reopen
                      </button>
                    </div>
                  )}

                  {query.status === "closed" && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-400 italic">Closed without a reply.</p>
                      <button
                        onClick={() => setQueryStatus(query, "open")}
                        disabled={updatingId === query._id}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <RotateCcw size={12} /> Reopen
                      </button>
                    </div>
                  )}
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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(query.status)}`}>
                    {query.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatTimestamp(query.createdAt)}</p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{query.message}</p>
                {query.status === "resolved" && (
                  <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
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
