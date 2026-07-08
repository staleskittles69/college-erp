"use client";

import { useState } from "react";
import { Lock, CheckCircle, XCircle } from "lucide-react";

export default function TeacherSettingsPage() {
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
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
    });
    const result = await response.json();
    if (response.ok) {
      setStatus("success");
      setMessage(result.message);
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } else {
      setStatus("error");
      setMessage(result.error);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences.</p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
            <Lock size={16} className="text-teal-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Change Password</h2>
            <p className="text-xs text-slate-400">Update your account password.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/30 rounded-lg px-3 py-2">
              <CheckCircle size={15} /> {message}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 rounded-lg px-3 py-2">
              <XCircle size={15} /> {message}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-60"
            >
              {status === "loading" ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
