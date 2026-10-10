"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarOff } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Modal from "@/components/ui/Modal";
import { formatPeriodTime, PERIOD_TIMES } from "@/lib/academics";

interface LeaveItem {
  _id: string;
  teacherName: string;
  department: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
}

interface Candidate { _id: string; name: string; hasClass: boolean; }

interface AffectedClass {
  date: string;
  period: number;
  time: string;
  room: string;
  subject: string;
  branch: string;
  year: number;
  section: string;
  substituteName: string | null;
  candidates: Candidate[];
}

interface LeaveDetail extends LeaveItem {
  classes: AffectedClass[];
}

const FILTERS = [
  { label: "Pending", status: "pending" },
  { label: "Approved", status: "approved" },
  { label: "Rejected", status: "rejected" },
  { label: "All", status: "" },
] as const;

const STATUS_STYLE: Record<LeaveItem["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

function formatRange(from: string, to: string) {
  return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
}

const classKey = (cls: Pick<AffectedClass, "date" | "period">) => `${cls.date}|${cls.period}`;

export default function AdminLeavePage() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIdx, setFilterIdx] = useState(0);

  const [detail, setDetail] = useState<LeaveDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const latestDetailIdRef = useRef("");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  function loadList() {
    setLoading(true);
    const status = FILTERS[filterIdx].status;
    fetch(`/api/admin/leave${status ? `?status=${status}` : ""}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx]);

  async function openDetail(id: string) {
    // Only the request opened last may fill the pop-up. Clicking another one (or closing it)
    // before this one loads must not let a slower, older response show the wrong request.
    latestDetailIdRef.current = id;
    setDetail(null);
    setDetailLoading(true);
    setPicks({});
    setAdminNote("");
    setActionError("");
    try {
      const response = await fetch(`/api/admin/leave/${id}`, { credentials: "include" });
      const data = response.ok ? await response.json() : null;
      if (latestDetailIdRef.current !== id) return;
      if (data) setDetail(data);
      else setActionError("Could not load this request.");
    } catch {
      if (latestDetailIdRef.current === id) setActionError("Network error. Please try again.");
    } finally {
      if (latestDetailIdRef.current === id) setDetailLoading(false);
    }
  }

  function closeDetail() {
    latestDetailIdRef.current = "";
    setDetail(null);
    setDetailLoading(false);
    setActionError("");
  }

  async function decide(action: "approve" | "reject") {
    if (!detail) return;
    if (action === "reject" && detail.status === "approved" && !confirm("Cancel this approved leave? Any substitutes will be released.")) return;
    setSaving(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/leave/${detail._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote,
          assignments:
            action === "approve"
              ? detail.classes
                  .filter((cls) => picks[classKey(cls)])
                  .map((cls) => ({ date: cls.date, period: cls.period, substituteTeacherId: picks[classKey(cls)] }))
              : [],
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setActionError(result.error ?? "Something went wrong.");
        return;
      }
    } catch {
      setActionError("Network error. Please try again.");
      return;
    } finally {
      setSaving(false);
    }
    closeDetail();
    loadList();
  }

  const uncovered = detail ? detail.classes.filter((cls) => !picks[classKey(cls)]).length : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Leave Requests" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Approve teacher leave and arrange cover for their classes.</p>
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
        ) : items.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <CalendarOff size={26} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-500">No leave requests here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item._id}>
                <button
                  onClick={() => openDetail(item._id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{item.teacherName}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatRange(item.fromDate, item.toDate)}</p>
                    <p className="text-sm text-gray-600 mt-1 truncate">{item.reason}</p>
                  </div>
                  <span className="text-xs font-medium text-orange-600 shrink-0">
                    {item.status === "pending" ? "Review" : "View"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(detailLoading || detail || actionError) && (
        <Modal
          title={detail ? `${detail.teacherName} · ${formatRange(detail.fromDate, detail.toDate)}` : "Leave request"}
          subtitle={detail ? detail.reason : undefined}
          onClose={closeDetail}
          maxWidth="max-w-2xl"
          panelClassName="max-h-[90vh] overflow-y-auto"
          headerClassName="sticky top-0 bg-white"
          portal
        >
          {detailLoading || !detail ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">{actionError || "Loading…"}</div>
          ) : (
            <>
              <div className="px-6 py-5 space-y-4">
                {detail.status === "pending" ? (
                  <p className="text-xs text-gray-500">
                    Pick who covers each class from the {detail.department} department. Colleagues whose timetable
                    shows a class in that period are marked, so you can choose someone free where possible.
                    Classes left on &quot;No substitute&quot; simply won&apos;t be taken.
                  </p>
                ) : (
                  detail.adminNote && <p className="text-xs text-gray-500">Note: {detail.adminNote}</p>
                )}

                {detail.classes.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    This teacher has no classes on these dates, so nothing needs covering.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.classes.map((cls) => (
                      <div key={classKey(cls)} className="rounded-lg border border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{cls.subject}</p>
                          <p className="text-xs text-gray-500">
                            {formatDay(cls.date)} · Period {cls.period} ({formatPeriodTime(cls.time || PERIOD_TIMES[cls.period] || "")}) · {cls.branch} {cls.section}
                          </p>
                        </div>
                        {detail.status === "pending" ? (
                          <select
                            value={picks[classKey(cls)] ?? ""}
                            onChange={(e) => setPicks((prev) => ({ ...prev, [classKey(cls)]: e.target.value }))}
                            aria-label={`Substitute for ${cls.subject} on ${cls.date}, period ${cls.period}`}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">No substitute</option>
                            {cls.candidates.map((candidate) => (
                              <option key={candidate._id} value={candidate._id}>{candidate.name}{candidate.hasClass ? " (has a class then)" : ""}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium ${cls.substituteName ? "text-gray-700" : "text-gray-400"}`}>
                            {cls.substituteName ? `Covered by ${cls.substituteName}` : "No substitute"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {detail.status === "pending" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Note to the teacher (optional)</label>
                    <input
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      maxLength={500}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {actionError && <p className="text-xs text-red-500">{actionError}</p>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <p className="text-xs text-gray-400">
                  {detail.status === "pending" && detail.classes.length > 0 ? `${uncovered} of ${detail.classes.length} without cover` : ""}
                </p>
                <div className="flex gap-3">
                  {detail.status === "pending" && (
                    <>
                      <button
                        onClick={() => decide("reject")}
                        disabled={saving}
                        className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => decide("approve")}
                        disabled={saving}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Approve"}
                      </button>
                    </>
                  )}
                  {detail.status === "approved" && (
                    <button
                      onClick={() => decide("reject")}
                      disabled={saving}
                      className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg disabled:opacity-60"
                    >
                      Cancel approval
                    </button>
                  )}
                  <button onClick={closeDetail} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg">Close</button>
                </div>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
