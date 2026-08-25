"use client";

import { ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface PortalNavbarProps {
  pageTitle: string;
  onMenuClick: () => void;
  avatar: ReactNode;
  portalBasePath: string;
}

// Shared header for the teacher and student portals: mobile menu button, page title,
// notification bell, an avatar slot (each portal renders its own), and logout.
export function PortalNavbar({ pageTitle, onMenuClick, avatar, portalBasePath }: PortalNavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden -ml-1 mr-1 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="w-1 h-5 rounded-full bg-orange-600 shrink-0 hidden sm:block" />
        <h1 className="text-base font-semibold text-gray-800 truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <NotificationBell portalBasePath={portalBasePath} />

        {avatar}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
          aria-label="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
