"use client";

import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";

interface AuditLog {
  _id: string;
  actorName: string;
  actorRole: "admin" | "teacher";
  action: "create" | "update" | "delete";
  entityType: string;
  description: string;
  createdAt: string;
}

const RANGE_OPTIONS = [
  { label: "Last 10 actions", days: null },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

const ACTION_STYLES: Record<AuditLog["action"], string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeIndex, setRangeIndex] = useState(0);

  const range = RANGE_OPTIONS[rangeIndex];

  function fetchLogs() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (range.days == null) {
      params.set("limit", "10");
    } else {
      params.set("days", String(range.days));
      params.set("limit", "500");
    }
    fetch(`/api/admin/audit-logs?${params.toString()}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setLogs)
      .catch(() => setError("Couldn't load audit logs."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGE_OPTIONS.map((option, index) => (
            <button
              key={option.label}
              onClick={() => setRangeIndex(index)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                rangeIndex === index
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="p-16 text-center text-sm text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600">No logs recorded</p>
              <p className="text-sm text-gray-400 mt-1">
                Nothing has been changed{range.days ? ` in the last ${range.days} days` : ""} yet.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map((log) => (
              <li key={log._id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ACTION_STYLES[log.action]}`}
                >
                  {log.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.actorName} <span className="capitalize">({log.actorRole})</span> · {formatTimestamp(log.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Logs older than 3 months are automatically cleared.
      </p>
    </div>
  );
}
