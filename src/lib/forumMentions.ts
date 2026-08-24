import { escapeRegex } from "./utils";

// Detects a trailing "@fragment" at the very end of the draft string. Only fires when the
// "@" is the tail of the whole message — this is a plain <input> composer with no cursor
// position tracking, not a rich editor, so mid-text "@" typing intentionally does nothing.
export function parseMentionFragment(draft: string): string | null {
  const match = /@(\w*)$/.exec(draft);
  return match ? match[1] : null;
}

// Replaces the trailing "@fragment" with "@Full Name " (trailing space).
export function applyMentionSelection(draft: string, fragment: string, name: string): string {
  return draft.slice(0, draft.length - fragment.length - 1) + `@${name} `;
}

// Keeps only pending mentions whose "@Name" substring still appears somewhere in the draft.
export function reconcilePendingMentions(
  pending: Record<string, string>,
  draft: string
): Record<string, string> {
  return Object.fromEntries(Object.entries(pending).filter(([, name]) => draft.includes(`@${name}`)));
}

// Splits message text into plain/highlighted segments for rendering "@name" mentions.
// Longest names are matched first so one mentioned name can't shadow a longer one that
// contains it as a prefix (e.g. "Ram" vs "Ramesh Iyer").
export function splitMessageForMentions(
  text: string,
  mentions: { userId: string; name: string }[]
): { text: string; isMention: boolean }[] {
  if (mentions.length === 0) return [{ text, isMention: false }];

  const names = [...new Set(mentions.map((mention) => mention.name))].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${names.map((name) => `@${escapeRegex(name)}`).join("|")})`, "g");

  return text
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, isMention: names.some((name) => part === `@${name}`) }));
}
