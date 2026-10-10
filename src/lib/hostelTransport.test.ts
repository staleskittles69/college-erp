import { describe, it, expect } from "vitest";
import {
  dueStatus,
  formatPickupTime,
  hostelFeeFor,
  normalizeGender,
  pendingAmount,
  roomRange,
  validateStops,
} from "./hostelTransport";

const fees = { twoAc: 90000, twoNonAc: 70000, threeAc: 75000, threeNonAc: 55000 };

describe("hostelFeeFor", () => {
  it("picks the price for each room type", () => {
    expect(hostelFeeFor(fees, 2, true)).toBe(90000);
    expect(hostelFeeFor(fees, 2, false)).toBe(70000);
    expect(hostelFeeFor(fees, 3, true)).toBe(75000);
    expect(hostelFeeFor(fees, 3, false)).toBe(55000);
  });
});

describe("pendingAmount", () => {
  it("is the full fee when nothing is paid", () => {
    expect(pendingAmount(70000, [])).toBe(70000);
  });
  it("is only the difference after an upgrade", () => {
    expect(pendingAmount(90000, [70000])).toBe(20000);
  });
  it("never goes below zero after a downgrade or cancel", () => {
    expect(pendingAmount(55000, [70000])).toBe(0);
    expect(pendingAmount(0, [70000])).toBe(0);
  });
});

describe("dueStatus", () => {
  const today = new Date("2026-10-10T10:00:00Z");
  it("is paid when nothing is pending", () => {
    expect(dueStatus(0, new Date("2026-01-01"), today)).toBe("paid");
  });
  it("is due with no due date or a future one", () => {
    expect(dueStatus(500, null, today)).toBe("due");
    expect(dueStatus(500, new Date("2026-10-31"), today)).toBe("due");
  });
  it("is still due on the due date itself", () => {
    expect(dueStatus(500, new Date("2026-10-10T00:00:00Z"), today)).toBe("due");
  });
  it("is overdue after the due date", () => {
    expect(dueStatus(500, new Date("2026-10-09T00:00:00Z"), today)).toBe("overdue");
  });
});

describe("normalizeGender", () => {
  it("maps common spellings", () => {
    expect(normalizeGender("Male")).toBe("boys");
    expect(normalizeGender(" m ")).toBe("boys");
    expect(normalizeGender("FEMALE")).toBe("girls");
    expect(normalizeGender("girls")).toBe("girls");
  });
  it("returns null for unknown or missing values", () => {
    expect(normalizeGender("")).toBeNull();
    expect(normalizeGender(undefined)).toBeNull();
    expect(normalizeGender("other")).toBeNull();
  });
});

describe("roomRange", () => {
  it("lists every room in the range", () => {
    expect(roomRange("101", "104")).toEqual(["101", "102", "103", "104"]);
  });
  it("keeps leading zeros", () => {
    expect(roomRange("008", "010")).toEqual(["008", "009", "010"]);
  });
  it("rejects bad ranges", () => {
    expect(roomRange("110", "101")).toBeNull();
    expect(roomRange("A1", "A5")).toBeNull();
    expect(roomRange("1", "500")).toBeNull();
  });
});

describe("validateStops", () => {
  it("accepts a good list", () => {
    expect(validateStops([{ name: "Main Gate", pickupTime: "07:30" }])).toBeNull();
  });
  it("rejects empty lists, missing names, bad times and duplicates", () => {
    expect(validateStops([])).not.toBeNull();
    expect(validateStops([{ name: "", pickupTime: "07:30" }])).not.toBeNull();
    expect(validateStops([{ name: "Gate", pickupTime: "7:30" }])).not.toBeNull();
    expect(
      validateStops([
        { name: "Gate", pickupTime: "07:30" },
        { name: "gate", pickupTime: "07:40" },
      ])
    ).not.toBeNull();
  });
});

describe("formatPickupTime", () => {
  it("formats 24-hour times as 12-hour", () => {
    expect(formatPickupTime("07:05")).toBe("7:05 AM");
    expect(formatPickupTime("12:00")).toBe("12:00 PM");
    expect(formatPickupTime("00:15")).toBe("12:15 AM");
  });
});
