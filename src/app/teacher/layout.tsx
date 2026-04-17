"use client";

import { useState } from "react";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherNavbar } from "@/components/teacher/TeacherNavbar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div className={`transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <TeacherNavbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
