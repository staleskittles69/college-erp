// Blocklist-based pre-filter for forum messages. Preventative, not a full profanity
// filter: messages containing these never post, and the sender is told to edit and resend.
export const FORUM_BANNED_WORDS = ["stupid", "idiot", "dumb", "shut up", "loser"];

export function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return FORUM_BANNED_WORDS.some((word) => lower.includes(word));
}
