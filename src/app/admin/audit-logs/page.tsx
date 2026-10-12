"use client";

import { useState } from "react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import AuditLogPanel from "@/components/admin/FeaturePanels/AuditLogPanel";
import LoginActivityPanel from "@/components/admin/FeaturePanels/LoginActivityPanel";

const TABS = [
  { id: "changes", label: "Changes", subtitle: "Every change admins and teachers make to student, teacher, and academic records." },
  { id: "logins", label: "Login activity", subtitle: "Sign-ins, wrong passwords, blocked attempts and password changes for every account." },
] as const;

export default function AuditLogsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("changes");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "Audit Logs" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">{active.subtitle}</p>
      </div>
      <div className="mb-4 flex gap-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
              tab === t.id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "changes" ? <AuditLogPanel /> : <LoginActivityPanel />}
    </div>
  );
}
