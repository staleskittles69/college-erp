"use client";

import { useState } from "react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { Lock, CheckCircle, XCircle } from "lucide-react";

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) {
      setStatus("error");
      setMessage("New passwords do not match");
      return;
    }
    setStatus("loading");
    let response: Response;
    let result: { message?: string; error?: string };
    try {
      response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      result = await response.json().catch(() => ({}));
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
      return;
    }
    if (response.ok) {
      setStatus("success");
      setMessage(result.message ?? "Password changed.");
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } else {
      setStatus("error");
      setMessage(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-tour="password-form">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
          <Lock size={16} className="text-orange-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">Password</h2>
          <p className="text-xs text-gray-500">Change your admin account password.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { label: "Current Password", value: current, set: setCurrent },
          { label: "New Password", value: newPass, set: setNewPass },
          { label: "Confirm New Password", value: confirm, set: setConfirm },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
              type="password"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
            />
          </div>
        ))}
        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle size={15} /> {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
            <XCircle size={15} /> {message}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-60"
          >
            {status === "loading" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb items={[{ label: "Settings" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your admin account.</p>
      </div>

      <PasswordSection />
    </div>
  );
}
