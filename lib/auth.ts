import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "gleanings_edit";
const ONE_YEAR = 60 * 60 * 24 * 365;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Cookie holds an HMAC of the password, never the password itself, so a
// leaked cookie can't be reversed and changing EDIT_PASSWORD revokes it.
function editToken(): string | null {
  const password = process.env.EDIT_PASSWORD;
  return password ? createHmac("sha256", password).update("gleanings-edit").digest("hex") : null;
}

/** Editing is always allowed locally (MUTATIONS_ENABLED); elsewhere only after unlocking. */
export async function canEdit(): Promise<boolean> {
  if (process.env.MUTATIONS_ENABLED === "true") return true;
  const token = editToken();
  if (!token) return false;
  const cookie = (await cookies()).get(COOKIE)?.value;
  return cookie !== undefined && safeEqual(cookie, token);
}

export async function assertCanEdit() {
  if (!(await canEdit())) throw new Error("Unlock editing first.");
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.EDIT_PASSWORD);
}

export async function tryUnlock(password: string): Promise<boolean> {
  const expected = process.env.EDIT_PASSWORD;
  const token = editToken();
  if (!expected || !token || !safeEqual(password, expected)) return false;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return true;
}

export async function clearEditCookie() {
  (await cookies()).delete(COOKIE);
}
