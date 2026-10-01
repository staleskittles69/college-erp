"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useFetch } from "@/hooks/useFetch";
import { findPageTour, getTourPlan, MOBILE_MENU_STEP, PageTour, TourRole, TourStep } from "@/lib/tour-steps";
import { SuggestionModal } from "@/components/ui/SuggestionModal";
import { clearTourFlag, isTourFlagged, TOUR_ENABLED } from "@/lib/tour-login";

export const START_TOUR_EVENT = "start-tour";

// Matches Tailwind's `md` breakpoint: below it the sidebar is a slide-out drawer.
const MOBILE_QUERY = "(max-width: 767px)";
// Slightly longer than the drawer's 300ms slide animation.
const DRAWER_ANIMATION_MS = 350;
// Pages fill in after their data loads, so wait (up to a limit) for the highlighted parts to appear.
const AUTO_START_DELAY_MS = 800;
const ELEMENT_POLL_MS = 200;
const AUTO_WAIT_LIMIT_MS = 3000;
// Right after login the tour should feel instant, so start sooner and wait less for the page to fill in.
const LOGIN_START_DELAY_MS = 150;
const LOGIN_WAIT_LIMIT_MS = 1500;
// When the ? button is clicked the page has usually loaded already, so don't keep the user waiting.
const BUTTON_WAIT_LIMIT_MS = 600;
// Loading skeletons (Tailwind's pulse animation) mean the page's data hasn't arrived yet.
const LOADING_SELECTOR = "main .animate-pulse";

// Remembered per browser *and* per account, so on a shared computer every person gets their own tour.
// The full tour (menu + top bar) uses the bare key; each page's tour adds its route.
const seenKey = (userId: string, pagePath?: string) => (pagePath ? `tour-seen:${userId}:${pagePath}` : `tour-seen:${userId}`);

function hasSeen(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    // Storage blocked (private mode etc.): treat as "seen" so the tour never nags on every page load.
    return true;
  }
}

function markSeen(key: string) {
  try {
    localStorage.setItem(key, "1");
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

// Steps pointing at something that isn't on the page (or is hidden, e.g. at phone width) are dropped,
// so progress ("3 of 12") stays accurate.
function isPresent(step: TourStep): boolean {
  if (!step.element) return true;
  const target = document.querySelector(step.element);
  return target !== null && target.getClientRects().length > 0;
}

const pageSteps = (page: PageTour | null) => (page ? page.steps.filter(isPresent) : []);

/** Resolves once the page has finished loading and every required step's element is on it, or the time limit runs out. */
function waitForPage(steps: TourStep[], limitMs: number, isCancelled: () => boolean): Promise<void> {
  const required = steps.filter((step) => !step.optional);
  const isReady = () => required.every(isPresent) && document.querySelector(LOADING_SELECTOR) === null;
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      if (isCancelled() || isReady() || Date.now() - startedAt >= limitMs) {
        resolve();
      } else {
        window.setTimeout(check, ELEMENT_POLL_MS);
      }
    };
    check();
  });
}

type TourMode = "full" | "page";

// Interactive walkthrough. The "full" tour (welcome, menu, top bar, then the page you're on) runs on first
// login and from the ? button on the dashboard; a "page" tour explains just the current page, and runs the
// first time each page is opened and from the ? button everywhere else. Render once per portal layout.
export function ProductTour({ role }: { role: TourRole }) {
  return TOUR_ENABLED ? <ProductTourRunner role={role} /> : null;
}

function ProductTourRunner({ role }: { role: TourRole }) {
  const { data: me } = useFetch<{ id?: string }>("/api/auth/me", {});
  const [showSuggestion, setShowSuggestion] = useState(false);
  const userId = me.id ?? null;
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const startingRef = useRef(false);
  const unmountingRef = useRef(false);
  // Lets an in-progress start notice that the user has already moved to a different page.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const startTour = useCallback(async (mode: TourMode, waitLimitMs: number) => {
    if (driverRef.current?.isActive() || startingRef.current) return;
    startingRef.current = true;
    try {
      const plan = getTourPlan(role);
      const startPath = pathname;
      const page = findPageTour(plan, startPath);
      if (mode === "page" && !page) return;

      const cancelled = () => unmountingRef.current || pathnameRef.current !== startPath;
      const [{ driver }] = await Promise.all([
        import("driver.js"),
        waitForPage(page?.steps ?? [], waitLimitMs, cancelled),
      ]);
      if (cancelled() || driverRef.current?.isActive()) return;

      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const isHome = startPath === plan.home;
      const content = pageSteps(page).map((step) => toDriveStep(step));
      // On the dashboard the welcome popup already introduces the page.
      const pageIntro = page && !(mode === "full" && isHome) ? [toDriveStep(page.intro)] : [];

      const steps: DriveStep[] = [];
      if (mode === "page") {
        steps.push(...pageIntro, ...content);
      } else {
        const sidebar = plan.sidebar.filter(isPresent);
        const navbar = plan.navbar.filter(isPresent).map((step) => toDriveStep(step));
        steps.push(toDriveStep(plan.welcome));
        if (isMobile) {
          // Mobile: the page and top bar first, then the ☰ button, whose Next opens the drawer for the
          // menu steps (the open drawer would cover everything else, so it goes last).
          steps.push(...pageIntro, ...content, ...navbar);
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
          // Desktop: menu, then the page, then the top bar (ending on the ? button).
          steps.push(...sidebar.map((step) => toDriveStep(step, { side: "right" })));
          steps.push(...pageIntro, ...content, ...navbar);
        }
      }

      let finished = false;
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
        // Finishing the full tour (Done on the last step) ends with the suggestion box; closing early doesn't.
        onNextClick: () => {
          if (tour.isLastStep()) {
            finished = true;
            tour.destroy();
          } else {
            tour.moveNext();
          }
        },
        onDestroyed: () => {
          driverRef.current = null;
          if (isMobile && mode === "full") closeDrawer();
          if (unmountingRef.current || !userId) return;
          if (mode === "full") markSeen(seenKey(userId));
          if (page) markSeen(seenKey(userId, page.path));
          if (finished && mode === "full") setShowSuggestion(true);
        },
      });

      driverRef.current = tour;
      tour.drive();
    } finally {
      startingRef.current = false;
    }
  }, [role, pathname, userId]);

  // Tear down cleanly if the portal layout unmounts mid-tour (e.g. logout).
  useEffect(() => {
    unmountingRef.current = false;
    return () => {
      unmountingRef.current = true;
      driverRef.current?.destroy();
    };
  }, []);

  // Leaving the page mid-tour (e.g. the browser's Back button) ends the tour — its steps belong to the old page.
  useEffect(() => () => { driverRef.current?.destroy(); }, [pathname]);

  // Auto-start: the full tour on this account's first visit in this browser, otherwise the page's own tour
  // the first time this page is opened.
  useEffect(() => {
    if (!userId) return;
    const plan = getTourPlan(role);
    const page = findPageTour(plan, pathname);
    // Every login shows the full tour straight away (the login page leaves a flag for us).
    const justLoggedIn = isTourFlagged() && pathname === plan.home;
    let mode: TourMode;
    if (justLoggedIn || !hasSeen(seenKey(userId))) mode = "full";
    else if (page && !hasSeen(seenKey(userId, page.path))) mode = "page";
    else return;
    // Small delay so the layout has finished rendering before we measure elements.
    const timer = window.setTimeout(() => {
      if (justLoggedIn) clearTourFlag();
      void startTour(mode, justLoggedIn ? LOGIN_WAIT_LIMIT_MS : AUTO_WAIT_LIMIT_MS);
    }, justLoggedIn ? LOGIN_START_DELAY_MS : AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [userId, role, pathname, startTour]);

  // The ? button in the navbar: the whole tour on the dashboard (or a page with no tour of its own),
  // otherwise just the current page.
  useEffect(() => {
    const handler = () => {
      const plan = getTourPlan(role);
      const mode: TourMode = pathname === plan.home || !findPageTour(plan, pathname) ? "full" : "page";
      void startTour(mode, BUTTON_WAIT_LIMIT_MS);
    };
    window.addEventListener(START_TOUR_EVENT, handler);
    return () => window.removeEventListener(START_TOUR_EVENT, handler);
  }, [role, pathname, startTour]);

  return showSuggestion ? <SuggestionModal onClose={() => setShowSuggestion(false)} /> : null;
}
