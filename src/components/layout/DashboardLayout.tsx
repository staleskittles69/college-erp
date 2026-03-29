"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";

type Role = "student" | "teacher" | "admin";

interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

function dashboardHome(role: Role): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "teacher") return "/dashboard/teacher";
  return "/dashboard/student";
}

export function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          if (data.role !== role) {
            router.replace(dashboardHome(data.role));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
        setLoading(false);
      });
  }, [role, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} userEmail={user.email} />
      <main className="flex-1 overflow-auto p-6 lg:p-8 ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
