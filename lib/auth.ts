import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, COOKIE_VALUE } from "./auth-constants";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

export function verifyPassword(submitted: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  // timingSafeEqual requires equal-length buffers — pad to max length, then
  // compare lengths separately (still constant-time for our threat model).
  const a = Buffer.from(submitted, "utf8");
  const b = Buffer.from(expected, "utf8");
  const max = Math.max(a.length, b.length);
  const pa = Buffer.alloc(max);
  const pb = Buffer.alloc(max);
  a.copy(pa);
  b.copy(pb);
  const equal = timingSafeEqual(pa, pb);
  return equal && a.length === b.length;
}

export async function isLoggedIn(): Promise<boolean> {
  // Unset APP_PASSWORD disables the auth wall entirely.
  if (!process.env.APP_PASSWORD) return true;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}
