"use client";

import { useState } from "react";
import { BedDouble, Snowflake, Fan, Users } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatRupees } from "@/lib/hostelTransport";

type Gender = "boys" | "girls";

interface RoomOption {
  sharing: 2 | 3;
  ac: boolean;
  label: string;
  fee: number;
  bedsLeft: number | null;
}

interface Booking {
  block: string;
  roomNumber: string;
  sharing: 2 | 3;
  ac: boolean;
  label: string;
  fee: number;
  occupiedBeds: number;
}

interface HostelData {
  gender: Gender | null;
  genderLocked: boolean;
  options: RoomOption[];
  booking: Booking | null;
  dueDate: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function HostelPage() {
  const [pickedGender, setPickedGender] = useState<Gender | null>(null);
  const { data, loading, refetch } = useFetch<HostelData | null>(
    `/api/student/hostel${pickedGender ? `?gender=${pickedGender}` : ""}`,
    null
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const gender = data?.gender ?? null;
  const booking = data?.booking ?? null;

  async function book(option: RoomOption) {
    const key = `${option.sharing}-${option.ac}`;
    setBusy(key);
    setError("");
    setMessage("");
    const response = await fetch("/api/student/hostel", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharing: option.sharing, ac: option.ac, gender }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : { error: "Network error. Please try again." };
    if (response?.ok) setMessage(`Done! You've been given Block ${result.block}, Room ${result.roomNumber} (${option.label}).`);
    else setError(result.error ?? "Could not book. Please try again.");
    setBusy(null);
    refetch();
  }

  async function cancel() {
    if (!confirm("Give up your hostel room? Any unpaid hostel fee will be removed.")) return;
    setBusy("cancel");
    setError("");
    setMessage("");
    const response = await fetch("/api/student/hostel", { method: "DELETE", credentials: "include" }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : { error: "Network error. Please try again." };
    if (response?.ok) setMessage("Your hostel room was cancelled.");
    else setError(result.error ?? "Could not cancel. Please try again.");
    setBusy(null);
    refetch();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Hostel" subtitle="Choose a room type and we'll assign you a room with a free bed. You can change or cancel any time." />

      {error && <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">{message}</p>}

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-gray-500">Couldn&apos;t load hostel details. Please refresh the page.</p>
      ) : (
        <>
          {booking && (
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50/60 p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <BedDouble size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Your room</p>
                  <p className="font-semibold text-gray-900 mt-0.5">Block {booking.block} · Room {booking.roomNumber}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {booking.label} · {booking.occupiedBeds} of {booking.sharing} beds taken
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
                {busy === "cancel" ? "Cancelling…" : "Cancel room"}
              </button>
            </div>
          )}

          {!data.genderLocked && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">Which hostel?</p>
              <p className="text-xs text-gray-500 mt-0.5">Your profile doesn&apos;t say, so pick one to see the rooms.</p>
              <div className="flex gap-2 mt-3">
                {(["boys", "girls"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setPickedGender(option)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      gender === option ? "bg-orange-600 border-orange-600 text-white" : "border-gray-200 text-gray-700 hover:border-orange-300"
                    }`}
                  >
                    {option === "boys" ? "Boys' hostel" : "Girls' hostel"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gender && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {booking ? "Switch room type" : "Pick a room type"} · {gender === "boys" ? "Boys'" : "Girls'"} hostel
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.options.map((option) => {
                  const key = `${option.sharing}-${option.ac}`;
                  const isMine = booking?.sharing === option.sharing && booking?.ac === option.ac;
                  const full = !isMine && (option.bedsLeft ?? 0) === 0;
                  const notPriced = option.fee <= 0;
                  return (
                    <div
                      key={key}
                      className={`rounded-xl border bg-white p-5 shadow-sm flex flex-col gap-4 ${isMine ? "border-orange-300" : "border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${option.ac ? "bg-sky-50 text-sky-600" : "bg-orange-50 text-orange-600"}`}>
                            {option.ac ? <Snowflake size={18} /> : <Fan size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{option.label}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Users size={11} /> {option.sharing} students per room
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            option.bedsLeft === 0 ? "bg-red-100 text-red-700" : (option.bedsLeft ?? 0) <= 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {option.bedsLeft === 0 ? "Full" : `${option.bedsLeft} beds left`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-auto">
                        <p className="text-lg font-bold text-gray-900">
                          {notPriced ? <span className="text-sm font-medium text-gray-400">Price not set</span> : <>{formatRupees(option.fee)}<span className="text-xs font-normal text-gray-500"> / year</span></>}
                        </p>
                        <button
                          onClick={() => book(option)}
                          disabled={busy !== null || full || isMine || notPriced}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busy === key ? "Booking…" : isMine ? "Your room type" : full ? "Full" : booking ? "Switch" : "Book"}
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
