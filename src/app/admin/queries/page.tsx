"use client";

import { useEffect, useState } from "react";
import { Inbox, Check, RotateCcw } from "lucide-react";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface QueryItem {
  _id: string;
  fromName: string;
  fromRole: "student" | "teacher";
  toName: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

const FILTERS = [
  { label: "Open", status: "open" },
  { label: "Resolved", status: "resolved" },
  { label: "All", status: "" },
] as const;

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function AdminQueriesPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIdx, setFilterIdx] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      setQueries((prev) =>
        FILTERS[filterIdx].status
          ? prev.filter((item) => item._id !== query._id)
          : prev.map((item) => (item._id === query._id ? { ...item, status: nextStatus } : item))
      );
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
                      {query.fromName} <span className="capitalize">({query.fromRole})</span> → {query.toName} · {formatTimestamp(query.createdAt)}
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
    </div>
  );
}
