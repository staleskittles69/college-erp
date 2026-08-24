export const FORUM_CATEGORIES = ["General", "Computer Science", "Career", "Campus Life"] as const;

export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

export function isForumCategory(value: unknown): value is ForumCategory {
  return typeof value === "string" && (FORUM_CATEGORIES as readonly string[]).includes(value);
}
