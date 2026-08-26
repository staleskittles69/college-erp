"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-64"}`}>
        <AdminNavbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
