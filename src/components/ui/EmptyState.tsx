import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  subtitle?: ReactNode;
}

export function EmptyState({ icon, iconClassName = "bg-gray-50 text-gray-400", title, subtitle }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconClassName}`}>
        {icon}
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-700">{title}</p>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
