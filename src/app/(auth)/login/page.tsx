"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function quickLogin(quickEmail: string, quickPassword: string) {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: quickEmail, password: quickPassword }),
      });
      if (response.ok) { router.push("/"); router.refresh(); }
      else { const result = await response.json(); setError(result.error ?? "Login failed."); setLoading(false); }
    } catch { setError("Network error."); setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Let middleware handle role-based redirect
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-xl border border-gray-200">

        {/* Left panel — branding */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-orange-600 to-orange-700 p-10 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo2.png" alt="NRI University" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-bold tracking-tight">NRI University</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Your college.<br />All in one place.
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Access your dashboard, attendance, grades, timetable, and more — all from a single portal.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-white/50 mb-2">Quick login (dev)</p>
            <div className="flex gap-2">
              {[
                { label: "Admin", email: "admin@college.edu", password: "admin123" },
                { label: "Teacher", email: "praful@college.edu", password: "asdfghjkl" },
                { label: "Student", email: "cse1.section1.1@college.edu", password: "student123" },
              ].map(({ label, email: quickEmail, password: quickPassword }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => quickLogin(quickEmail, quickPassword)}
                  className="rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-medium text-white transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <img src="/logo-nri.png" alt="NRI University" className="h-9 w-auto" />
            <span className="text-lg font-bold text-gray-900">NRI University</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@college.edu"
                autoFocus
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>

          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            NRI University &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
}
