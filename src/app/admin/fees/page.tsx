"use client";

import { useEffect, useState } from "react";
import { Wallet, Search } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { useFetch } from "@/hooks/useFetch";
import { formatRupees } from "@/lib/hostelTransport";

interface Due {
  id: string;
  type: "hostel" | "transport";
  description: string;
  amount: number;
  status: "pending" | "paid";
  createdAt: string;
  paidAt: string | null;
  studentName: string;
  rollNumber: string;
  className: string;
}

interface DuesResponse {
  dues: Due[];
  limited: boolean;
  pendingTotal: number;
  pendingCount: number;
}

interface FeeSettings { transportDueDate: string | null; }

const FILTERS = [
  { label: "Pending", status: "pending" },
  { label: "Paid", status: "paid" },
  { label: "All", status: "" },
] as const;

const STATUS_STYLE: Record<Due["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminFeesPage() {
  const [filterIdx, setFilterIdx] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<DuesResponse>({ dues: [], limited: false, pendingTotal: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: settings } = useFetch<FeeSettings | null>("/api/admin/fees/settings", null);
  const [transportDue, setTransportDue] = useState("");
  const [dateMessage, setDateMessage] = useState("");

  useEffect(() => {
    if (settings) setTransportDue(settings.transportDueDate ?? "");
  }, [settings]);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    const status = FILTERS[filterIdx].status;
    if (status) params.set("status", status);
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);
    fetch(`/api/admin/fees?${params}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData({ dues: [], limited: false, pendingTotal: 0, pendingCount: 0 }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIdx, typeFilter, search]);

  // Search 300ms after typing stops.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function setStatus(due: Due, status: "paid" | "pending") {
    const question =
      status === "paid"
        ? `Mark ${formatRupees(due.amount)} ${due.type} fee for ${due.studentName} (${due.rollNumber}) as paid?`
        : `Undo the payment for ${due.studentName} (${due.rollNumber})? Their dues will be recalculated.`;
    if (!confirm(question)) return;
    setBusyId(due.id);
    setError("");
    const response = await fetch(`/api/admin/fees/${due.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Could not update.");
    }
    setBusyId(null);
    load();
  }

  async function saveTransportDue() {
    setDateMessage("");
    const response = await fetch("/api/admin/fees/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transportDueDate: transportDue || null }),
    });
    setDateMessage(response.ok ? "Saved" : "Could not save");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Fees" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees</h1>
          <p className="text-sm text-gray-500 mt-1">Hostel and transport dues. Tick a due as paid once the accounts office receives it.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupees(data.pendingTotal)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{data.pendingCount} unpaid due{data.pendingCount === 1 ? "" : "s"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Transport fee due date</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="date"
              value={transportDue}
              onChange={(e) => { setTransportDue(e.target.value); setDateMessage(""); }}
              aria-label="Transport fee due date"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button onClick={saveTransportDue} disabled={!settings} className="text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50">Save</button>
            {dateMessage && <span className="text-xs text-gray-500">{dateMessage}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">The hostel due date is set on the Hostel page.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by roll number or name"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by fee type" className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Hostel &amp; transport</option>
          <option value="hostel">Hostel</option>
          <option value="transport">Transport</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Loading…</div>
        ) : data.dues.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Wallet size={26} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-500">No dues here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Student", "Fee", "Amount", "Date", ""].map((heading) => (
                    <th key={heading} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.dues.map((due) => (
                  <tr key={due.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{due.studentName}</p>
                      <p className="text-xs text-gray-500">{due.rollNumber} · {due.className}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <p>{due.description}</p>
                      <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[due.status]}`}>{due.status}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatRupees(due.amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {due.status === "paid" && due.paidAt ? `Paid ${formatDate(due.paidAt)}` : `Booked ${formatDate(due.createdAt)}`}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {due.status === "pending" ? (
                        <button
                          onClick={() => setStatus(due, "paid")}
                          disabled={busyId !== null}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-60"
                        >
                          {busyId === due.id ? "Saving…" : "Mark paid"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(due, "pending")}
                          disabled={busyId !== null}
                          className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-60"
                        >
                          {busyId === due.id ? "Saving…" : "Undo"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.limited && <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">Showing the latest 200. Search to narrow it down.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
