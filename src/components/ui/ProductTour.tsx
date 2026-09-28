"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useFetch } from "@/hooks/useFetch";
import { getTourPlan, MOBILE_MENU_STEP, TourRole, TourStep } from "@/lib/tour-steps";

export const START_TOUR_EVENT = "start-tour";

// Matches Tailwind's `md` breakpoint: below it the sidebar is a slide-out drawer.
const MOBILE_QUERY = "(max-width: 767px)";
// Slightly longer than the drawer's 300ms slide animation.
const DRAWER_ANIMATION_MS = 350;

// Remembered per browser *and* per account, so on a shared computer every person gets their own tour.
const seenKey = (userId: string) => `tour-seen:${userId}`;

function hasSeenTour(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) !== null;
  } catch {
    // Storage blocked (private mode etc.): treat as "seen" so the tour never nags on every page load.
    return true;
  }
}

function markTourSeen(userId: string) {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    // ignore — worst case the tour shows again next time
  }
}

const clickButton = (selector: string) => document.querySelector<HTMLElement>(selector)?.click();
const openDrawer = () => clickButton('[aria-label="Open menu"]');
const closeDrawer = () => clickButton('[aria-label="Close menu"]');

function toDriveStep(step: TourStep, overrides: Partial<NonNullable<DriveStep["popover"]>> = {}): DriveStep {
  return {
    element: step.element,
    popover: { title: step.title, description: step.description, side: step.side, align: step.align, ...overrides },
  };
}

// Steps pointing at something that isn't on the page are dropped, so progress ("3 of 12") stays accurate.
const isPresent = (step: TourStep) => !step.element || document.querySelector(step.element) !== null;

// Interactive walkthrough shown on first login and whenever a "start-tour" event fires
// (see TourButton). Render once per portal layout.
export function ProductTour({ role }: { role: TourRole }) {
  const { data: me } = useFetch<{ id?: string }>("/api/auth/me", {});
  const userId = me.id ?? null;
  const driverRef = useRef<Driver | null>(null);
  const unmountingRef = useRef(false);

  const startTour = useCallback(async () => {
    if (driverRef.current?.isActive()) return;

    const { driver } = await import("driver.js");
    if (unmountingRef.current || driverRef.current?.isActive()) return;

    const isMobile = window.matchMedia(MOBILE_QUERY).matches;
    const plan = getTourPlan(role);
    const sidebar = plan.sidebar.filter(isPresent);
    const navbar = plan.navbar.filter(isPresent);

    // Desktop: sidebar, then top bar. Mobile: top bar first, then the ☰ button, whose Next opens
    // the drawer for the sidebar steps (the open drawer would cover the ☰ button, so it goes last).
    const steps: DriveStep[] = [toDriveStep(plan.welcome)];
    if (isMobile) {
      steps.push(...navbar.map((step) => toDriveStep(step)));
      if (sidebar.length > 0) {
        steps.push(
          toDriveStep(MOBILE_MENU_STEP, {
            onNextClick: () => {
              openDrawer();
              window.setTimeout(() => tour.moveNext(), DRAWER_ANIMATION_MS);
            },
          })
        );
        steps.push(
          ...sidebar.map((step, index) =>
            toDriveStep(step, {
              side: "bottom",
              // The ☰ button is hidden behind the open drawer, so close it before stepping back to it.
              ...(index === 0 && {
                onPrevClick: () => {
                  closeDrawer();
                  window.setTimeout(() => tour.movePrevious(), DRAWER_ANIMATION_MS);
                },
              }),
            })
          )
        );
      }
    } else {
      steps.push(...sidebar.map((step) => toDriveStep(step, { side: "right" })));
      steps.push(...navbar.map((step) => toDriveStep(step)));
    }

    const tour = driver({
      steps,
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      popoverClass: "tour-popover",
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 8,
      // Highlighted links/buttons are for looking at, not clicking, during the tour.
      disableActiveInteraction: true,
      // A stray click on the dimmed area shouldn't end the tour; use ×, Esc or Done.
      overlayClickBehavior: () => {},
      onDestroyed: () => {
        driverRef.current = null;
        if (isMobile) closeDrawer();
        if (!unmountingRef.current && userId) markTourSeen(userId);
      },
    });

    driverRef.current = tour;
    tour.drive();
  }, [role, userId]);

  // Tear down cleanly if the portal layout unmounts mid-tour (e.g. logout).
  useEffect(() => {
    unmountingRef.current = false;
    return () => {
      unmountingRef.current = true;
      driverRef.current?.destroy();
    };
  }, []);

  // Auto-start on this account's first visit in this browser.
  useEffect(() => {
    if (!userId || hasSeenTour(userId)) return;
    // Small delay so the layout has finished rendering before we measure elements.
    const timer = window.setTimeout(() => { void startTour(); }, 800);
    return () => window.clearTimeout(timer);
  }, [userId, startTour]);

  // Replay on demand (the ? button in the navbar).
  useEffect(() => {
    const handler = () => { void startTour(); };
    window.addEventListener(START_TOUR_EVENT, handler);
    return () => window.removeEventListener(START_TOUR_EVENT, handler);
  }, [startTour]);

  return null;
}
