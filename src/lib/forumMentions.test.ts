import { describe, it, expect } from "vitest";
import {
  parseMentionFragment,
  applyMentionSelection,
  reconcilePendingMentions,
  splitMessageForMentions,
} from "./forumMentions";

describe("parseMentionFragment", () => {
  it("captures the fragment after a trailing @", () => {
    expect(parseMentionFragment("hey @ram")).toBe("ram");
  });

  it("captures an empty fragment right after a bare @", () => {
    expect(parseMentionFragment("hey @")).toBe("");
  });

  it("returns null when there's no trailing @", () => {
    expect(parseMentionFragment("hello everyone")).toBeNull();
  });

  it("returns null when the @ isn't at the tail of the string", () => {
    expect(parseMentionFragment("@ram hello")).toBeNull();
  });

  it("returns null once a space follows the mention", () => {
    expect(parseMentionFragment("hey @ram ")).toBeNull();
  });
});

describe("applyMentionSelection", () => {
  it("replaces the trailing fragment with the full name plus a trailing space", () => {
    expect(applyMentionSelection("hey @ra", "ra", "Ramesh Iyer")).toBe("hey @Ramesh Iyer ");
  });

  it("handles an empty fragment (bare @)", () => {
    expect(applyMentionSelection("hey @", "", "Priya Patel")).toBe("hey @Priya Patel ");
  });
});

describe("reconcilePendingMentions", () => {
  it("keeps a mention whose @Name substring is still present", () => {
    const pending = { u1: "Ramesh Iyer" };
    expect(reconcilePendingMentions(pending, "hey @Ramesh Iyer can you help")).toEqual(pending);
  });

  it("drops a mention once its @Name substring is edited away", () => {
    const pending = { u1: "Ramesh Iyer" };
    expect(reconcilePendingMentions(pending, "hey can you help")).toEqual({});
  });
});

describe("splitMessageForMentions", () => {
  it("returns the text unsplit when there are no mentions", () => {
    expect(splitMessageForMentions("hello", [])).toEqual([{ text: "hello", isMention: false }]);
  });

  it("marks the mention segment as highlighted", () => {
    const result = splitMessageForMentions("hey @Ramesh Iyer can you help", [
      { userId: "u1", name: "Ramesh Iyer" },
    ]);
    expect(result).toEqual([
      { text: "hey ", isMention: false },
      { text: "@Ramesh Iyer", isMention: true },
      { text: " can you help", isMention: false },
    ]);
  });

  it("prefers the longer of two overlapping names", () => {
    const result = splitMessageForMentions("cc @Ram and @Ramesh Iyer", [
      { userId: "u1", name: "Ram" },
      { userId: "u2", name: "Ramesh Iyer" },
    ]);
    expect(result).toEqual([
      { text: "cc ", isMention: false },
      { text: "@Ram", isMention: true },
      { text: " and ", isMention: false },
      { text: "@Ramesh Iyer", isMention: true },
    ]);
  });
});
