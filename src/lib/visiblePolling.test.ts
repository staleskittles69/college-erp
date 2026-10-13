import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startVisiblePolling } from "./visiblePolling";

// Minimal stand-in for the browser's `document` — tests run in a node environment.
function fakeDocument(initial: "visible" | "hidden") {
  const listeners = new Set<() => void>();
  const doc = {
    visibilityState: initial,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    setVisibility(state: "visible" | "hidden") {
      doc.visibilityState = state;
      listeners.forEach((fn) => fn());
    },
    listenerCount: () => listeners.size,
  };
  return doc;
}

describe("startVisiblePolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("polls on the interval while the tab is visible", () => {
    vi.stubGlobal("document", fakeDocument("visible"));
    const poll = vi.fn();
    startVisiblePolling(poll, 1000);
    vi.advanceTimersByTime(3000);
    expect(poll).toHaveBeenCalledTimes(3);
  });

  it("sends nothing while hidden, then polls immediately when the tab comes back", () => {
    const doc = fakeDocument("visible");
    vi.stubGlobal("document", doc);
    const poll = vi.fn();
    startVisiblePolling(poll, 1000);

    doc.setVisibility("hidden");
    vi.advanceTimersByTime(10_000);
    expect(poll).not.toHaveBeenCalled();

    doc.setVisibility("visible");
    expect(poll).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("does not start polling if the tab opens hidden", () => {
    vi.stubGlobal("document", fakeDocument("hidden"));
    const poll = vi.fn();
    startVisiblePolling(poll, 1000);
    vi.advanceTimersByTime(5000);
    expect(poll).not.toHaveBeenCalled();
  });

  it("cleanup stops polling and removes the listener", () => {
    const doc = fakeDocument("visible");
    vi.stubGlobal("document", doc);
    const poll = vi.fn();
    const stop = startVisiblePolling(poll, 1000);
    stop();
    vi.advanceTimersByTime(5000);
    expect(poll).not.toHaveBeenCalled();
    expect(doc.listenerCount()).toBe(0);
  });
});
