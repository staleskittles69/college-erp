"use client";

import { ReactNode } from "react";
import { Menu, ChevronLeft, X } from "lucide-react";
import { SidebarItem } from "@/components/sidebar/SidebarItem";

export interface PortalMenuItem {
  icon: ReactNode;
  label: string;
  href: string;
  exact?: boolean;
}

interface PortalSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  menuItems: PortalMenuItem[];
  name: string;
  email: string;
  /** Shown as the fallback display name and avatar initial when name is empty, e.g. "Teacher" or "Student". */
  roleLabel: string;
}

// Shared shell for the teacher and student portal sidebars: mobile backdrop, collapse/expand
// mechanics, logo header, and user footer. Menu items and identity are portal-specific props —
// the admin sidebar has a genuinely different layout architecture and isn't a fit for this shell.
export function PortalSidebar({
  isCollapsed,
  toggleSidebar,
  mobileOpen,
  onCloseMobile,
  menuItems,
  name,
  email,
  roleLabel,
}: PortalSidebarProps) {
  const displayName = name || roleLabel;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm w-64 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex h-16 items-center shrink-0 border-b border-gray-200 px-4">
          {isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden md:mx-auto md:flex rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-900 transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          <div className={`items-center w-full flex ${isCollapsed ? "md:hidden" : ""}`}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <img src="/logo-nri.png" alt="NRI University" className="h-7 w-auto shrink-0" />
              <span className="text-slate-900 font-bold text-base tracking-tight truncate">NRI University</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden md:flex rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={onCloseMobile}
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <SidebarItem key={item.href} {...item} isCollapsed={isCollapsed} onNavigate={onCloseMobile} />
            ))}
          </nav>
        </div>

        <div className={`px-4 py-4 border-t border-gray-200 shrink-0 ${isCollapsed ? "md:hidden" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
              {displayName[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-900 text-sm font-medium truncate">{displayName}</p>
              <p className="text-slate-400 text-xs truncate">{email || "—"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
