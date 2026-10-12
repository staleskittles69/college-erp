// Also used in the browser (admin forms), so keep this file dependency-free.

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_RULES_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number. No common words like "password" or "student".`;

// Passwords that are, or are a word from this list plus some digits/symbols
// (e.g. "student2025", "Password@1"), are refused.
const BLOCKED_WORDS = [
  "password", "passw0rd", "pass", "student", "teacher", "admin", "administrator", "college",
  "school", "university", "nri", "rvr", "qwerty", "qwertyuiop", "asdf", "asdfgh", "asdfghjkl",
  "zxcvbn", "abc", "abcd", "abcdef", "abcdefgh", "welcome", "letmein", "iloveyou", "login",
  "user", "test", "india", "monkey", "dragon", "sunshine", "princess", "football", "cricket",
  "master", "secret", "changeme", "default",
];

const BLOCKED_PASSWORDS = [
  "1234567890a", "a1234567890", "1q2w3e4r5t", "1qaz2wsx3edc", "q1w2e3r4t5", "zaq12wsx",
];

/**
 * Returns an error message, or null if the password is acceptable.
 * `identifiers` are things the password must not contain — the user's email,
 * roll number, etc. Short fragments (< 4 chars) are ignored.
 */
export function validatePasswordStrength(password: string, identifiers: string[] = []): string | null {
  if (typeof password !== "string") return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > 128) return "Password must be at most 128 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (new Set(password.toLowerCase()).size < 5) return "Password is too repetitive";

  const lower = password.toLowerCase();
  const lettersOnly = lower.replace(/[^a-z]/g, "");
  if (BLOCKED_PASSWORDS.includes(lower) || BLOCKED_WORDS.includes(lettersOnly)) {
    return "That password is too common. Pick something harder to guess";
  }

  for (const identifier of identifiers) {
    const parts = identifier.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length >= 4);
    if (parts.some((part) => lower.includes(part))) {
      return "Password must not contain your roll number, email or name";
    }
  }

  return null;
}
