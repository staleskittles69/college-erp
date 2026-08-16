import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
}

export default function Breadcrumb({ items, homeHref = "/admin" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
      <Link
        href={homeHref}
        className="text-gray-400 hover:text-orange-600 transition-colors flex-shrink-0"
      >
        <Home size={13} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
            {isLast || !item.href ? (
              <span
                className={`truncate ${
                  isLast ? "font-semibold text-gray-800" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-orange-600 transition-colors truncate"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
