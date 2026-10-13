// Calls `poll` every `intervalMs`, but only while the tab is visible. A hidden tab
// (backgrounded, minimised) sends no requests; when it becomes visible again we poll
// once right away so the user sees fresh data, then resume the interval.
// Returns a cleanup function — call it from a useEffect cleanup.
export function startVisiblePolling(poll: () => void, intervalMs: number): () => void {
  let interval: ReturnType<typeof setInterval> | null = null;

  function start() {
    if (interval === null) interval = setInterval(poll, intervalMs);
  }

  function stop() {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      poll();
      start();
    } else {
      stop();
    }
  }

  if (document.visibilityState === "visible") start();
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    stop();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
