// Tiny hand-off between the login page and the portal's walkthrough (components/ui/ProductTour.tsx):
// every successful login leaves this flag behind, and the portal shows the full tour as soon as it opens.
// Kept in its own file so the login page doesn't have to load the tour library.

const KEY = "tour-on-login";

// Master switch for the walkthrough: false hides the tour and the "?" button everywhere. The full feature is also
// saved on the `walkthrough-tour` git branch.
export const TOUR_ENABLED = false;

export function flagTourOnLogin() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked: the tour just falls back to its first-visit behaviour.
  }
  // Forget which pages' tours were already seen, so every page explains itself again after each login.
  try {
    const seen: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith("tour-seen:")) seen.push(key);
    }
    seen.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function isTourFlagged(): boolean {
  try {
    return sessionStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearTourFlag() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
