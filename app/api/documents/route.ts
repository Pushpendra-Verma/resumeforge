import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/session";
import {
  coerceDoc,
  readDocs,
  storeConfigured,
  writeDocs,
} from "@/lib/server/store";

export const runtime = "nodejs";

/** List the signed-in user's documents (most-recently-updated first). */
export async function GET(req: NextRequest) {
  if (!storeConfigured()) {
    return NextResponse.json({ error: "store_not_configured" }, { status: 503 });
  }
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const docs = await readDocs(session.sub);
  docs.sort((a, b) => b.updatedAt - a.updatedAt);
  return NextResponse.json({ documents: docs });
}

/** Create a new document for the signed-in user. */
export async function POST(req: NextRequest) {
  if (!storeConfigured()) {
    return NextResponse.json({ error: "store_not_configured" }, { status: 503 });
  }
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const now = Date.now();
  const doc = coerceDoc(body, {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  if (!doc) {
    return NextResponse.json({ error: "invalid_document" }, { status: 400 });
  }

  const docs = await readDocs(session.sub);
  docs.push(doc);
  await writeDocs(session.sub, docs);
  return NextResponse.json({ document: doc }, { status: 201 });
}
