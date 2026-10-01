"use client";

import { CircleHelp } from "lucide-react";
import { START_TOUR_EVENT } from "@/components/ui/ProductTour";
import { TOUR_ENABLED } from "@/lib/tour-login";

// "?" button that replays the portal walkthrough. ProductTour (rendered in each portal layout) listens for the event.
export function TourButton() {
  if (!TOUR_ENABLED) return null;
  return (
    <button
      onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      aria-label="Take a tour"
      title="Take a tour"
    >
      <CircleHelp size={20} />
    </button>
  );
}
