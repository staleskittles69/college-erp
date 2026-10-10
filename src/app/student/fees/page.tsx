"use client";

import { Wallet, Bus, BedDouble, Info } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRupees } from "@/lib/hostelTransport";

interface Due {
  id: string;
  type: "hostel" | "transport";
  description: string;
  amount: number;
  dueDate: string | null;
  status: "paid" | "due" | "overdue";
  paidAt: string | null;
}

interface FeesData {
  dues: Due[];
  totalPending: number;
  refundDue: boolean;
}

const STATUS_STYLE: Record<Due["status"], { label: string; className: string }> = {
  due: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function PaymentDuePage() {
  const { data, loading } = useFetch<FeesData>("/api/student/fees", { dues: [], totalPending: 0, refundDue: false });
  const overdue = data.dues.some((due) => due.status === "overdue");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Payment Due" subtitle="Your hostel and transport fees. Pay at the accounts office." />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data.dues.length === 0 ? (
        <EmptyState
          icon={<Wallet size={30} />}
          iconClassName="bg-green-50 text-green-500"
          title="Nothing to pay"
          subtitle="Book a hostel room or a bus seat and its fee will show up here."
        />
      ) : (
        <>
          <div
            className={`rounded-xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
              data.totalPending === 0 ? "border-green-200 bg-green-50" : overdue ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total due</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatRupees(data.totalPending)}</p>
            </div>
            <p className={`text-sm font-medium ${data.totalPending === 0 ? "text-green-700" : overdue ? "text-red-700" : "text-orange-700"}`}>
              {data.totalPending === 0 ? "All paid. Thank you!" : overdue ? "Some fees are past their due date" : "Please pay before the due date"}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {data.dues.map((due) => {
                const style = STATUS_STYLE[due.status];
                return (
                  <li key={due.id} className="px-5 py-4 flex flex-wrap items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      {due.type === "hostel" ? <BedDouble size={18} /> : <Bus size={18} />}
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-sm font-semibold text-gray-800">{due.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {due.status === "paid"
                          ? due.paidAt ? `Paid on ${formatDate(due.paidAt)}` : "Paid"
                          : due.dueDate ? `Due by ${formatDate(due.dueDate)}` : "Due date not announced yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <p className="text-sm font-bold text-gray-900">{formatRupees(due.amount)}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.className}`}>{style.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {data.refundDue && (
            <p className="rounded-lg bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-700">
              You&apos;ve paid more than your current booking costs. Any refund is handled at the accounts office.
            </p>
          )}
        </>
      )}

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <Info size={14} className="shrink-0 mt-0.5" />
        Pay at the accounts office. It will show as paid here once they record it.
      </p>
    </div>
  );
}
