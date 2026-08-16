"use client";

import { ReactNode } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface PortalNavbarProps {
  pageTitle: string;
  onMenuClick: () => void;
  avatar: ReactNode;
}

// Shared header for the teacher and student portals: mobile menu button, page title,
// notification bell, an avatar slot (each portal renders its own), and logout.
export function PortalNavbar({ pageTitle, onMenuClick, avatar }: PortalNavbarProps) {
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
        <button
          className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-orange-600" />
        </button>

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
