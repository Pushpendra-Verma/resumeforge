import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — remove after debugging cross-device sync.
const DIAG_TOKEN = "d1ag-4f9a2c7b6e1487-temp";

/**
 * Guarded diagnostic that exercises the session round-trip and Google JWKS
 * reachability WITHOUT needing a real Google login, so we can isolate why sync
 * fails. Mints a session cookie for a throwaway "diagnostic-user" sub only.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== DIAG_TOKEN) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const incoming = req.cookies.get(SESSION_COOKIE)?.value;
  const incomingSession = incoming ? await verifySessionToken(incoming) : null;

  // Can this server reach Google's public keys? (jose needs this to verify the
  // Google ID token during real sign-in.)
  let jwksReachable = false;
  let jwksError: string | null = null;
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
      cache: "no-store",
    });
    jwksReachable = r.ok;
    if (!r.ok) jwksError = `HTTP ${r.status}`;
  } catch (e) {
    jwksError = e instanceof Error ? e.message : "fetch_failed";
  }

  const token = await createSessionToken({
    sub: "diagnostic-user",
    email: "diag@example.com",
    name: "Diag",
    picture: "",
  });
  const roundTrip = await verifySessionToken(token);

  const res = NextResponse.json({
    sawIncomingCookie: Boolean(incoming),
    incomingCookieValid: Boolean(incomingSession),
    sessionSignVerifyRoundTrip: Boolean(roundTrip),
    jwksReachable,
    jwksError,
    cookieSecure: sessionCookieOptions.secure,
    cookieSameSite: sessionCookieOptions.sameSite,
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
