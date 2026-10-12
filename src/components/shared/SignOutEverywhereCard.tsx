"use client";

import { useState } from "react";
import { MonitorSmartphone, CheckCircle, XCircle } from "lucide-react";

// Settings card: ends every login for this account except the one in this browser.
export default function SignOutEverywhereCard({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/sessions/revoke-all", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(
        result.ended > 0
          ? `Signed out of ${result.ended} other device${result.ended === 1 ? "" : "s"}.`
          : "You weren't signed in anywhere else."
      );
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
          <MonitorSmartphone size={16} className="text-orange-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">Other devices</h2>
          <p className="text-xs text-gray-500">
            Signed in on a shared or lost device? Sign it out from here. Changing your password does this too.
          </p>
        </div>
      </div>

      {status === "success" && (
        <div className="mb-3 flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle size={15} />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="mb-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
          <XCircle size={15} />
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClick}
          disabled={status === "loading"}
          className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-60"
        >
          {status === "loading" ? "Signing out…" : "Sign out of all other devices"}
        </button>
      </div>
    </div>
  );
}
