"use client";

import { useState, useEffect } from "react";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { TeacherNavbar } from "@/components/teacher/TeacherNavbar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");

  useEffect(() => {
    fetch("/api/teachers/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setTeacherName(data.name);
        if (data.email) setTeacherEmail(data.email);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar
        isCollapsed={isCollapsed}
        toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        name={teacherName}
        email={teacherEmail}
      />
      <div className={`transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <TeacherNavbar name={teacherName} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
