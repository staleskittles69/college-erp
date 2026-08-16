"use client";

import { useEffect, useState } from "react";
import { Inbox, Check, RotateCcw, X } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";

interface QueryItem {
  _id: string;
  fromName: string;
  fromRole: "student" | "teacher";
  toName: string;
  subject: string;
  message: string;
  status: "open" | "resolved" | "closed";
  reply?: string | null;
  createdAt: string;
}

const FILTERS = [
  { label: "Open", status: "open" },
  { label: "Resolved", status: "resolved" },
  { label: "Closed", status: "closed" },
  { label: "All", status: "" },
] as const;

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

export default function AdminQueriesPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIdx, setFilterIdx] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  function fetchQueries() {
    setLoading(true);
    const status = FILTERS[filterIdx].status;
    const params = status ? `?status=${status}` : "";
    fetch(`/api/queries${params}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setQueries)
      .catch(() => setQueries([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx]);

  function applyStatusUpdate(id: string, updates: Partial<QueryItem>) {
    setQueries((prev) =>
      FILTERS[filterIdx].status && FILTERS[filterIdx].status !== updates.status
        ? prev.filter((item) => item._id !== id)
        : prev.map((item) => (item._id === id ? { ...item, ...updates } : item))
    );
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
      applyStatusUpdate(query._id, { status: "resolved", reply });
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
      applyStatusUpdate(query._id, { status });
    }
    setUpdatingId(null);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Queries" }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queries</h1>
          <p className="text-sm text-gray-500 mt-1">Messages from teachers and students.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map((filter, index) => (
            <button
              key={filter.label}
              onClick={() => setFilterIdx(index)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterIdx === index ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : queries.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Inbox size={24} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600">No queries</p>
              <p className="text-sm text-gray-400 mt-1">
                {FILTERS[filterIdx].status === "open" ? "Nothing waiting on you." : "Nothing here yet."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {queries.map((query) => (
              <li key={query._id} className="px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{query.subject}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(query.status)}`}>
                      {query.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {query.fromName} <span className="capitalize">({query.fromRole})</span> → {query.toName} · {formatTimestamp(query.createdAt)}
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
    </div>
  );
}
