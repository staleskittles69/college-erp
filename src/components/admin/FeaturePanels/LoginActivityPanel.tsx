"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

type EventType =
  | "login"
  | "login_failed"
  | "login_blocked"
  | "logout"
  | "password_changed"
  | "password_reset_by_admin"
  | "sessions_revoked";

interface AuthEvent {
  _id: string;
  type: EventType;
  userName: string | null;
  role: "admin" | "teacher" | "student" | null;
  identifier: string | null;
  ip: string | null;
  userAgent: string | null;
  detail: string | null;
  createdAt: string;
}

const FILTERS = [
  { label: "Everything", type: null },
  { label: "Failed & blocked", type: "problems" },
  { label: "Sign-ins", type: "login" },
  { label: "Password changes", type: "password_changed" },
] as const;

const EVENT_LABELS: Record<EventType, { label: string; style: string }> = {
  login: { label: "Signed in", style: "bg-green-100 text-green-700" },
  login_failed: { label: "Wrong password", style: "bg-amber-100 text-amber-700" },
  login_blocked: { label: "Blocked", style: "bg-red-100 text-red-700" },
  logout: { label: "Signed out", style: "bg-gray-100 text-gray-600" },
  password_changed: { label: "Password changed", style: "bg-blue-100 text-blue-700" },
  password_reset_by_admin: { label: "Password reset", style: "bg-blue-100 text-blue-700" },
  sessions_revoked: { label: "Other devices signed out", style: "bg-purple-100 text-purple-700" },
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function who(event: AuthEvent) {
  if (event.userName) return `${event.userName}${event.role ? ` (${event.role})` : ""}`;
  if (event.identifier) return `Unknown account "${event.identifier}"`;
  return "Unknown";
}

export default function LoginActivityPanel() {
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterIndex, setFilterIndex] = useState(0);

  const filter = FILTERS[filterIndex];

  function fetchEvents() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ days: "30", limit: "200" });
    if (filter.type) params.set("type", filter.type);
    fetch(`/api/admin/login-activity?${params.toString()}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setEvents)
      .catch(() => setError("Couldn't load login activity."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {FILTERS.map((option, index) => (
            <button
              key={option.label}
              onClick={() => setFilterIndex(index)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterIndex === index ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchEvents}
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
        ) : events.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ShieldCheck size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-600">Nothing in the last 30 days</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {events.map((event) => {
              const meta = EVENT_LABELS[event.type];
              return (
                <li key={event._id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.style}`}>
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">
                      {who(event)}
                      {event.detail ? <span className="text-gray-500"> · {event.detail}</span> : null}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate" title={event.userAgent ?? undefined}>
                      {formatTimestamp(event.createdAt)}
                      {event.ip ? ` · IP ${event.ip}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Shows the last 30 days. Older entries are cleared automatically after 3 months.
      </p>
    </div>
  );
}
