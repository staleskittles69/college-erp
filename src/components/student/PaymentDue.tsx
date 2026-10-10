"use client";

import Link from "next/link";
import { Wallet, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { useFetch } from "@/hooks/useFetch";
import { formatRupees } from "@/lib/hostelTransport";

interface Due {
  dueDate: string | null;
  status: "paid" | "due" | "overdue";
}

interface FeesData {
  dues: Due[];
  totalPending: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function PaymentDue() {
  const { data, loading } = useFetch<FeesData>("/api/student/fees", { dues: [], totalPending: 0 });

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-12 w-12 rounded-xl bg-gray-100 mb-4" />
          <div className="h-8 w-24 bg-gray-100 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  const pending = data.dues.filter((due) => due.status !== "paid");
  const overdue = pending.some((due) => due.status === "overdue");
  const nextDueDate = pending
    .map((due) => due.dueDate)
    .filter((date): date is string => Boolean(date))
    .sort()[0];

  const state =
    data.dues.length === 0 ? "none" : data.totalPending === 0 ? "paid" : overdue ? "overdue" : "due";

  const styles = {
    none: { amount: "text-gray-300", iconBg: "bg-gray-100", icon: "text-gray-400", badge: null },
    paid: { amount: "text-green-600", iconBg: "bg-green-100", icon: "text-green-600", badge: { label: "All paid", cls: "bg-green-100 text-green-700" } },
    due: { amount: "text-orange-600", iconBg: "bg-orange-100", icon: "text-orange-600", badge: { label: "Due", cls: "bg-amber-100 text-amber-700" } },
    overdue: { amount: "text-red-600", iconBg: "bg-red-100", icon: "text-red-600", badge: { label: "Overdue", cls: "bg-red-100 text-red-700" } },
  }[state];

  const footnote =
    state === "none"
      ? "Nothing to pay. Hostel and bus fees show up here once booked."
      : state === "paid"
        ? "Your hostel and bus fees are all paid."
        : nextDueDate
          ? `${overdue ? "Was due" : "Pay by"} ${formatDate(nextDueDate)} at the accounts office`
          : "Pay at the accounts office";

  return (
    <Link href="/student/fees" className="block h-full">
      <Card className="h-full hover:shadow-md hover:border-orange-200 transition-all duration-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
              <Wallet size={22} className={styles.icon} />
            </div>
            {styles.badge && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge.cls}`}>{styles.badge.label}</span>
            )}
          </div>

          <p className={`text-4xl font-bold ${styles.amount} mb-0.5`}>{formatRupees(data.totalPending)}</p>
          <p className="text-sm font-medium text-gray-500 mb-4">Payment due</p>

          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs ${state === "overdue" ? "text-red-600 font-medium" : "text-gray-400"}`}>{footnote}</p>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
