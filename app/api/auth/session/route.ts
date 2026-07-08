import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  sessionsConfigured,
  verifyGoogleCredential,
} from "@/lib/server/session";

export const runtime = "nodejs";

/**
 * Exchange a Google ID token (from client-side sign-in) for our own httpOnly
 * session cookie. The Google token is verified against Google's public keys
 * here on the server, so the resulting session is trustworthy.
 */
export async function POST(req: NextRequest) {
  if (!sessionsConfigured()) {
    // Backend not provisioned yet — client stays in local-only mode.
    return NextResponse.json({ error: "sessions_not_configured" }, { status: 503 });
  }

  let credential = "";
  try {
    const body = (await req.json()) as { credential?: unknown };
    credential = typeof body.credential === "string" ? body.credential : "";
  } catch {
    /* invalid JSON handled below */
  }
  if (!credential) {
    return NextResponse.json({ error: "missing_credential" }, { status: 400 });
  }

  const user = await verifyGoogleCredential(credential);
  if (!user) {
    return NextResponse.json({ error: "invalid_credential" }, { status: 401 });
  }

  const token = await createSessionToken(user);
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}

/** Sign out: clear the session cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
