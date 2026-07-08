import { NextResponse } from "next/server";
import { sessionsConfigured } from "@/lib/server/session";
import { pingDb, storeConfigured } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint for the cross-device-sync backend. Reports whether the
 * database and session secret are configured and whether the DB is reachable.
 * Exposes NO user data — safe to hit publicly while troubleshooting.
 */
export async function GET() {
  const dbError = await pingDb();
  return NextResponse.json({
    storeConfigured: storeConfigured(),
    sessionsConfigured: sessionsConfigured(),
    googleClientId: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    dbReachable: dbError === null,
    dbError,
  });
}
