"use client";

import { useState } from "react";
import { Bus, MapPin, Clock } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPickupTime, formatRupees } from "@/lib/hostelTransport";

interface Stop { name: string; pickupTime: string; }

interface RouteOption {
  id: string;
  routeNumber: string;
  name: string;
  stops: Stop[];
  annualFee: number;
  seatsLeft: number;
}

interface Booking {
  routeId: string;
  routeNumber: string;
  routeName: string;
  stopName: string;
  pickupTime: string | null;
  fee: number;
}

interface TransportData {
  routes: RouteOption[];
  booking: Booking | null;
  dueDate: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function TransportPage() {
  const { data, loading, refetch } = useFetch<TransportData>("/api/student/transport", { routes: [], booking: null, dueDate: null });
  const [pickedStop, setPickedStop] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const booking = data.booking;

  async function book(route: RouteOption) {
    const stopName = pickedStop[route.id] ?? (booking?.routeId === route.id ? booking.stopName : route.stops[0]?.name);
    if (!stopName) return;
    setBusy(route.id);
    setError("");
    setMessage("");
    const response = await fetch("/api/student/transport", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId: route.id, stopName }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setMessage(`You're booked on Route ${route.routeNumber}, ${stopName} stop.`);
    else setError(result.error ?? "Could not book. Please try again.");
    setBusy(null);
    refetch();
  }

  async function cancel() {
    if (!confirm("Cancel your bus booking? Any unpaid bus fee will be removed.")) return;
    setBusy("cancel");
    setError("");
    setMessage("");
    const response = await fetch("/api/student/transport", { method: "DELETE", credentials: "include" });
    const result = await response.json().catch(() => ({}));
    if (response.ok) setMessage("Your bus booking was cancelled.");
    else setError(result.error ?? "Could not cancel. Please try again.");
    setBusy(null);
    refetch();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Transport" subtitle="Pick your college bus route and stop. You can change or cancel any time." />

      {error && <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">{message}</p>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {booking && (
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50/60 p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Bus size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Your bus</p>
                  <p className="font-semibold text-gray-900 mt-0.5">Route {booking.routeNumber} · {booking.routeName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {booking.stopName} stop{booking.pickupTime ? ` · pickup ${formatPickupTime(booking.pickupTime)}` : ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    Yearly fee {formatRupees(booking.fee)}{data.dueDate ? ` · due ${formatDate(data.dueDate)}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={cancel}
                disabled={busy !== null}
                className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 bg-white rounded-lg px-4 py-2 disabled:opacity-60"
              >
                {busy === "cancel" ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          )}

          {data.routes.length === 0 ? (
            <EmptyState
              icon={<Bus size={30} />}
              iconClassName="bg-orange-50 text-orange-500"
              title="No bus routes yet"
              subtitle="The college hasn't added any routes. Check back soon."
            />
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">{booking ? "Switch to another route or stop" : "Available routes"}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.routes.map((route) => {
                  const isMine = booking?.routeId === route.id;
                  const selected = pickedStop[route.id] ?? (isMine ? booking.stopName : route.stops[0]?.name ?? "");
                  const full = route.seatsLeft === 0 && !isMine;
                  const nothingToChange = isMine && selected === booking.stopName;
                  return (
                    <div
                      key={route.id}
                      className={`rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-4 ${isMine ? "border-orange-300" : "border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">Route {route.routeNumber} · {route.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{formatRupees(route.annualFee)} / year</p>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            route.seatsLeft === 0 ? "bg-red-100 text-red-700" : route.seatsLeft <= 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {route.seatsLeft === 0 ? "Full" : `${route.seatsLeft} seats left`}
                        </span>
                      </div>

                      <ol className="space-y-1.5">
                        {route.stops.map((stop) => (
                          <li key={stop.name} className="flex items-center gap-2 text-sm">
                            <MapPin size={13} className={stop.name === selected ? "text-orange-600" : "text-gray-300"} />
                            <span className={stop.name === selected ? "font-medium text-gray-900" : "text-gray-600"}>{stop.name}</span>
                            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                              <Clock size={11} /> {formatPickupTime(stop.pickupTime)}
                            </span>
                          </li>
                        ))}
                      </ol>

                      <div className="flex flex-wrap items-center gap-2 mt-auto">
                        <select
                          value={selected}
                          onChange={(e) => setPickedStop((prev) => ({ ...prev, [route.id]: e.target.value }))}
                          aria-label={`Stop for route ${route.routeNumber}`}
                          className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {route.stops.map((stop) => (
                            <option key={stop.name} value={stop.name}>{stop.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => book(route)}
                          disabled={busy !== null || full || nothingToChange}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busy === route.id
                            ? "Saving…"
                            : full
                              ? "Full"
                              : isMine
                                ? nothingToChange ? "Your bus" : "Change stop"
                                : booking
                                  ? "Switch here"
                                  : "Book"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
