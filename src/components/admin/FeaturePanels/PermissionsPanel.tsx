"use client";

import { useEffect, useState } from "react";

export interface PermissionEntry {
  _id: string;
  userId: string;
  rollNo: string;
  studentName: string;
  reason: string;
  grantedByName: string;
  grantedAt: string;
}

interface PermissionsPanelProps {
  studentId?: string;
  context?: string;
}

export function formatGrantedAt(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Shows how often this student has been let out of campus during the day, and lets an admin remove
// an entry that was logged by mistake. New exits are logged from the Student Permissions page.
export default function PermissionsPanel({ studentId = "", context }: PermissionsPanelProps) {
  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
  const [counts, setCounts] = useState({ total: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  function loadPermissions() {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/admin/permissions?studentId=${studentId}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { total: number; today: number; permissions: PermissionEntry[] } | null) => {
        setPermissions(data?.permissions ?? []);
        setCounts({ total: data?.total ?? 0, today: data?.today ?? 0 });
      })
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPermissions(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(entry: PermissionEntry) {
    if (!confirm(`Remove the campus exit logged at ${formatGrantedAt(entry.grantedAt)}?`)) return;
    setDeletingId(entry._id);
    setError("");
    try {
      const response = await fetch(`/api/admin/permissions/${entry._id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error ?? "Failed to remove entry");
        return;
      }
      loadPermissions();
    } catch {
      setError("Network error");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Campus Exits</h3>
        {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-100">
        {[
          { label: "Total exits", value: counts.total, color: "text-orange-600 bg-orange-50" },
          { label: "Today", value: counts.today, color: "text-purple-600 bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg px-4 py-3 ${stat.color}`}>
            <p className="text-xl font-bold">{loading ? "–" : stat.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {error && <p className="px-6 pt-3 text-xs text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Granted at</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Granted by</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : permissions.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No campus exits logged.</td></tr>
            ) : (
              permissions.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-800 whitespace-nowrap">{formatGrantedAt(entry.grantedAt)}</td>
                  <td className="px-6 py-3.5 text-gray-700">{entry.reason || <span className="text-gray-400">—</span>}</td>
                  <td className="px-6 py-3.5 text-gray-500">{entry.grantedByName}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(entry)}
                      disabled={deletingId === entry._id}
                      className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                    >
                      {deletingId === entry._id ? "Removing..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
