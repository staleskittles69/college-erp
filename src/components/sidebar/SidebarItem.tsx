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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all group ${
        isActive 
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <div className={`flex items-center justify-center w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {icon}
      </div>
      {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
    </Link>
  );
}
