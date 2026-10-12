"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LogOut } from "lucide-react";
import { PASSWORD_RULES_HINT, validatePasswordStrength } from "@/lib/passwordRules";

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20";

// Shown (by middleware) to anyone whose account is flagged to pick a new password —
// new accounts, admin-reset passwords, and everyone still on a default password.
export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!current || !newPass || !confirm) { setError("Please fill in all three fields."); return; }
    if (newPass !== confirm) { setError("The new passwords don't match."); return; }
    const ruleError = validatePasswordStrength(newPass);
    if (ruleError) { setError(ruleError); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShowPasswords(!showPasswords)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      tabIndex={-1}
      aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
    >
      {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <KeyRound size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Set a new password</h1>
            <p className="text-sm text-gray-500">You need to do this once before continuing.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Current password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setError(""); }}
                placeholder="The password you just logged in with"
                autoComplete="current-password"
                autoFocus
                className={INPUT_CLASS}
              />
              {toggle}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">New password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={newPass}
                onChange={(e) => { setNewPass(e.target.value); setError(""); }}
                placeholder="Pick something only you know"
                autoComplete="new-password"
                className={INPUT_CLASS}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{PASSWORD_RULES_HINT}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm new password</label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                placeholder="Type it again"
                autoComplete="new-password"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save and continue"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="mx-auto mt-6 flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <LogOut size={13} /> Log out instead
        </button>
      </div>
    </div>
  );
}
