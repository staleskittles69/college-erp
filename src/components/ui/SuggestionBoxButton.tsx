"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { SuggestionModal } from "@/components/ui/SuggestionModal";

// Sidebar entry that opens the suggestion box from any page, in every portal.
export function SuggestionBoxButton({ collapsed, onOpen }: { collapsed: boolean; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); onOpen?.(); }}
        title={collapsed ? "Suggestion Box" : undefined}
        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 transition-colors duration-150 hover:bg-gray-50 hover:text-slate-900 ${
          collapsed ? "md:justify-center" : ""
        }`}
      >
        <Lightbulb size={18} className="flex-shrink-0" />
        <span className={collapsed ? "md:hidden" : ""}>Suggestion Box</span>
      </button>
      {open && <SuggestionModal onClose={() => setOpen(false)} />}
    </>
  );
}
