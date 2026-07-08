import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";

/**
 * Server-side authentication for the Vercel-native backend.
 *
 * The app signs users in with Google Identity Services in the browser, which
 * yields a short-lived Google ID token (JWT). We can't trust anything the
 * client tells us about "who they are", so on the server we:
 *
 *   1. VERIFY that Google ID token's signature against Google's public keys
 *      (and check its audience is our OAuth client), extracting a trusted `sub`.
 *   2. Mint OUR OWN long-lived session token (signed with SESSION_SECRET) and
 *      store it in an httpOnly cookie. Every subsequent API request is
 *      authorized from that cookie — never from a client-supplied id.
 *
 * This is what guarantees one user can't read or write another user's resumes.
 */

export const SESSION_COOKIE = "gr_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

/** Sessions only work once both secrets are configured (see README / Vercel env). */
export function sessionsConfigured(): boolean {
  return SESSION_SECRET.length > 0 && GOOGLE_CLIENT_ID.length > 0;
}

const secretKey = () => new TextEncoder().encode(SESSION_SECRET);

// Google's JWKS, cached across invocations by jose.
const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

/**
 * Verify a Google ID token and return the trusted profile, or null if the
 * token is invalid / not for our app.
 */
export async function verifyGoogleCredential(
  credential: string,
): Promise<SessionUser | null> {
  if (!GOOGLE_CLIENT_ID) return null;
  try {
    const { payload } = await jwtVerify(credential, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: GOOGLE_CLIENT_ID,
    });
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? payload.email ?? "User"),
      picture: String(payload.picture ?? ""),
    };
  } catch {
    return null;
  }
}

/** Mint our own session token for a verified user. */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    picture: user.picture,
  } satisfies JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

/** Verify our own session token from the cookie. */
export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  if (!SESSION_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      picture: String(payload.picture ?? ""),
    };
  } catch {
    return null;
  }
}

/** Read + verify the current session from a request's cookies. */
export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
