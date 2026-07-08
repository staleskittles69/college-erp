"use client";

import { useState } from "react";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { Bell, Lock, Users, Globe, CheckCircle, XCircle } from "lucide-react";

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
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setMessage(data.message);
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } else {
      setStatus("error");
      setMessage(data.error);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Lock size={16} className="text-indigo-600" />
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
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
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
          >
            {status === "loading" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const STATIC_SECTIONS = [
  {
    icon: Users,
    title: "Account",
    description: "Update admin name, email, and profile picture.",
    fields: [
      { label: "Full Name", type: "text", placeholder: "Admin Name" },
      { label: "Email Address", type: "email", placeholder: "admin@college.edu" },
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure which events trigger admin notifications.",
    toggles: [
      { label: "New student registration", enabled: true },
      { label: "Attendance below 75%", enabled: true },
      { label: "New announcement posted", enabled: false },
      { label: "Test schedule updated", enabled: false },
    ],
  },
  {
    icon: Globe,
    title: "College Information",
    description: "Update college name, address, and academic year.",
    fields: [
      { label: "College Name", type: "text", placeholder: "e.g. ABC Engineering College" },
      { label: "Academic Year", type: "text", placeholder: "e.g. 2025–2026" },
      { label: "Address", type: "text", placeholder: "City, State" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb items={[{ label: "Settings" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your admin account and system preferences.</p>
      </div>

      <div className="space-y-5">
        {/* Account section */}
        {STATIC_SECTIONS.filter((s) => s.title === "Account").map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <section.icon size={16} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">{section.title}</h2>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
            </div>
            <div className="space-y-3">
              {section.fields!.map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Live password section */}
        <PasswordSection />

        {/* Notifications + College Info */}
        {STATIC_SECTIONS.filter((s) => s.title !== "Account").map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <section.icon size={16} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">{section.title}</h2>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
            </div>
            {section.fields && (
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
            {section.toggles && (
              <div className="space-y-3">
                {section.toggles.map((toggle) => (
                  <div key={toggle.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{toggle.label}</span>
                    <div
                      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${
                        toggle.enabled ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          toggle.enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
