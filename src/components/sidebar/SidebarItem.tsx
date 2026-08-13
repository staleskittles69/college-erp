"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ icon, label, href, isCollapsed, onNavigate }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={isCollapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group ${
        isActive
          ? 'bg-orange-50 text-orange-600 font-semibold'
          : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'
      } ${isCollapsed ? 'md:justify-center' : ''}`}
    >
      <span className="flex items-center justify-center w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110">
        {icon}
      </span>
      <span className={`font-medium text-sm truncate ${isCollapsed ? 'md:hidden' : ''}`}>{label}</span>
    </Link>
  );
}
