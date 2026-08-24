"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";

interface PortalNavbarProps {
  pageTitle: string;
  onMenuClick: () => void;
  avatar: ReactNode;
  portalBasePath: string;
}

interface NotificationItem {
  _id: string;
  type: string;
  actorName: string;
  forumId: string;
  forumName: string;
  messageId: string;
  messagePreview: string;
  read: boolean;
  createdAt: string;
}

const NOTIFICATION_POLL_MS = 12000;

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Shared header for the teacher and student portals: mobile menu button, page title,
// notification bell, an avatar slot (each portal renders its own), and logout.
export function PortalNavbar({ pageTitle, onMenuClick, avatar, portalBasePath }: PortalNavbarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, refetch, setData } = useFetch<{ notifications: NotificationItem[]; unreadCount: number }>(
    "/api/notifications",
    { notifications: [], unreadCount: 0 }
  );

  useEffect(() => {
    const interval = setInterval(refetch, NOTIFICATION_POLL_MS);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH", credentials: "include" });
    setData((prev) => ({ notifications: prev.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
  }

  function handleNotificationClick(notification: NotificationItem) {
    if (!notification.read) {
      fetch(`/api/notifications/${notification._id}`, { method: "PATCH", credentials: "include" }).catch(() => {});
      setData((prev) => ({
        notifications: prev.notifications.map((n) => (n._id === notification._id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
    setShowNotifications(false);
    router.push(`${portalBasePath}/forums?forum=${notification.forumId}`);
  }

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
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={19} />
            {data.unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-orange-600" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Notifications</p>
                {data.unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                    Mark all read
                  </button>
                )}
              </div>
              {data.notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-400">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.notifications.map((notification) => (
                    <li key={notification._id}>
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          notification.read ? "" : "bg-orange-50/60"
                        }`}
                      >
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold">{notification.actorName}</span> mentioned you in{" "}
                          <span className="font-semibold">{notification.forumName}</span>
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{notification.messagePreview}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{relativeTime(notification.createdAt)}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

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
