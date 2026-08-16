"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  headerExtra?: ReactNode;
  maxWidth?: string;
  panelClassName?: string;
  headerClassName?: string;
  /** Render via a portal into document.body instead of in place. */
  portal?: boolean;
}

function ModalPanel({
  title,
  subtitle,
  onClose,
  children,
  headerExtra,
  maxWidth = "max-w-md",
  panelClassName,
  headerClassName,
}: Omit<ModalProps, "portal">) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cn("bg-white rounded-2xl shadow-xl w-full", maxWidth, panelClassName)}>
        <div className={cn("flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0", headerClassName)}>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Modal({ portal, ...rest }: ModalProps) {
  if (portal) {
    if (typeof document === "undefined") return null;
    return createPortal(<ModalPanel {...rest} />, document.body);
  }
  return <ModalPanel {...rest} />;
}
