"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isCollapsed: boolean;
}

export function SidebarItem({ icon, label, href, isCollapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-white/65 hover:bg-white/10 hover:text-white'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <span className="flex items-center justify-center w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110">
        {icon}
      </span>
      {!isCollapsed && (
        <span className="font-medium text-sm truncate">{label}</span>
      )}
    </Link>
  );
}
