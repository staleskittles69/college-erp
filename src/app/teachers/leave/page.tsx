"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarOff, Trash2 } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { formatPeriodTime, PERIOD_TIMES, teacherAttendanceUrl } from "@/lib/academics";

interface Substitution {
  date: string;
  period: number;
  subject: string;
  branch: string;
  section: string;
  substituteName: string;
}

interface LeaveItem {
  _id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  substitutions: Substitution[];
}

interface Cover {
  _id: string;
  date: string;
  period: number;
  time: string;
  room: string;
  subject: string;
  branch: string;
  year: number;
  section: string;
  coveringFor: string;
}

const STATUS_STYLE: Record<LeaveItem["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

function formatRange(from: string, to: string) {
  return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
}

export default function TeacherLeavePage() {
  const { data, loading, error, refetch } = useFetch<{ requests: LeaveItem[]; covering: Cover[] }>(
    "/api/teachers/leave",
    { requests: [], covering: [] }
  );

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit() {
    if (!fromDate || !toDate || !reason.trim()) {
      setFormError("Start date, end date and a reason are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const response = await fetch("/api/teachers/leave", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromDate, toDate, reason }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setFormError(result.error ?? "Could not send the request.");
      setSaving(false);
      return;
    }
    setFromDate("");
    setToDate("");
    setReason("");
    setSaving(false);
    refetch();
  }

  async function handleWithdraw(item: LeaveItem) {
    if (!confirm(`Withdraw your leave request for ${formatRange(item.fromDate, item.toDate)}?`)) return;
    const response = await fetch(`/api/teachers/leave/${item._id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.error ?? "Could not withdraw the request.");
      return;
    }
    refetch();
  }

  const today = todayString();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
          <CalendarOff size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leave</h1>
          <p className="text-sm text-gray-500">Ask for time off and see who is covering your classes</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Request leave</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From <span className="text-red-400">*</span></label>
            <input
              type="date"
              min={today}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (!toDate || toDate < e.target.value) setToDate(e.target.value);
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To <span className="text-red-400">*</span></label>
            <input
              type="date"
              min={fromDate || today}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reason <span className="text-red-400">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Attending a conference"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Classes I&apos;m covering</h2>
        {loading ? (
          <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ) : data.covering.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
            Nothing to cover right now.
          </p>
        ) : (
          <div className="space-y-2">
            {data.covering.map((cover) => (
              <div key={cover._id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{cover.subject}</p>
                  <p className="text-xs text-gray-500">
                    {cover.branch} · {cover.section} · Period {cover.period} · {formatPeriodTime(cover.time || PERIOD_TIMES[cover.period] || "")}
                  </p>
                  <p className="text-[11px] font-medium text-blue-700 mt-1">Covering for {cover.coveringFor}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600">{formatDay(cover.date)}</p>
                  {cover.date === today && (
                    <Link href={teacherAttendanceUrl(cover)} className="text-xs font-medium text-orange-600 hover:underline">
                      Take attendance
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">My requests</h2>
        {loading ? (
          <div className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ) : error ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Could not load your requests.</p>
        ) : data.requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
            You haven&apos;t asked for any leave yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.requests.map((item) => (
              <div key={item._id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{formatRange(item.fromDate, item.toDate)}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                    {item.adminNote && <p className="text-xs text-gray-500 mt-1">Admin: {item.adminNote}</p>}
                  </div>
                  {item.status === "pending" && (
                    <button
                      onClick={() => handleWithdraw(item)}
                      aria-label="Withdraw request"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {item.status === "approved" && item.substitutions.length > 0 && (
                  <ul className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                    {item.substitutions.map((sub) => (
                      <li key={`${sub.date}-${sub.period}`} className="text-xs text-gray-500">
                        {formatDay(sub.date)} · P{sub.period} · {sub.subject} ({sub.branch} {sub.section}) — covered by{" "}
                        <span className="font-medium text-gray-700">{sub.substituteName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
