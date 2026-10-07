/** Small pure helpers for the admin login, kept separate so they can be unit-tested. */

/** Whether the request carries a Supabase login cookie ("sb-<project>-auth-token", maybe split in parts). */
export function hasAuthCookie(cookieNames: string[]): boolean {
  return cookieNames.some((name) => /^sb-.+-auth-token(\.\d+)?$/.test(name));
}

/**
 * Where to go after logging in. Only paths on this site are allowed, so a crafted login
 * link can't send the admin to another website ("//evil.com", "https://…").
 */
export function safeNextPath(next: string | null | undefined, fallback = "/admin"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}

/** A basic shape check before asking Supabase to send a login link. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
