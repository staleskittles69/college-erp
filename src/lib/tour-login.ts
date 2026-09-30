// Tiny hand-off between the login page and the portal's walkthrough (components/ui/ProductTour.tsx):
// every successful login leaves this flag behind, and the portal shows the full tour as soon as it opens.
// Kept in its own file so the login page doesn't have to load the tour library.

const KEY = "tour-on-login";

export function flagTourOnLogin() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked: the tour just falls back to its first-visit behaviour.
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
