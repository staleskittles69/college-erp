import { describe, it, expect } from "vitest";
import { cn, escapeRegex } from "./utils";

describe("cn", () => {
  it("joins truthy class names with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", undefined, false, "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(undefined, false)).toBe("");
  });
});

describe("escapeRegex", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegex("a.b*c")).toBe("a\\.b\\*c");
  });

  it("leaves plain text untouched", () => {
    expect(escapeRegex("Jane Doe")).toBe("Jane Doe");
  });

  it("neutralizes a regex-injection payload so it's treated as a literal string", () => {
    const payload = ".*";
    const re = new RegExp(escapeRegex(payload));
    expect(re.test("anything")).toBe(false);
    expect(re.test(".*")).toBe(true);
  });
});
