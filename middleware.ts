import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

// Gates the whole site with one password (EDIT_PASSWORD) — same cookie
// lib/auth.ts already sets, so getting past this also unlocks editing.
// Not configured (e.g. local dev without EDIT_PASSWORD) → stays open.
export const config = { matcher: ["/", "/settings", "/export"], runtime: "nodejs" };

function expectedToken(): string | null {
  const password = process.env.EDIT_PASSWORD;
  return password ? createHmac("sha256", password).update("gleanings-edit").digest("hex") : null;
}

export function middleware(request: NextRequest) {
  const expected = expectedToken();
  if (!expected) return NextResponse.next();

  const cookie = request.cookies.get("gleanings_edit")?.value;
  const bufA = cookie ? Buffer.from(cookie) : Buffer.alloc(0);
  const bufB = Buffer.from(expected);
  const unlocked = bufA.length === bufB.length && timingSafeEqual(bufA, bufB);

  if (unlocked || request.nextUrl.pathname === "/private") return NextResponse.next();
  return NextResponse.redirect(new URL("/private", request.url));
}
