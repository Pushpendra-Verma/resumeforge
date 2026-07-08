import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/server/session";
import {
  coerceDoc,
  readDocs,
  storeConfigured,
  writeDocs,
} from "@/lib/server/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function authed(req: NextRequest) {
  if (!storeConfigured()) {
    return { error: NextResponse.json({ error: "store_not_configured" }, { status: 503 }) };
  }
  const session = await getSession(req);
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { sub: session.sub };
}

/** Fetch one document by id. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const a = await authed(req);
  if (a.error) return a.error;
  const { id } = await params;
  const doc = (await readDocs(a.sub)).find((d) => d.id === id);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

/** Upsert (save) a document. Used by autosave and by local→cloud migration. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const a = await authed(req);
  if (a.error) return a.error;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const docs = await readDocs(a.sub);
  const existing = docs.find((d) => d.id === id);
  const doc = coerceDoc(body, {
    id,
    createdAt: existing?.createdAt,
    updatedAt: Date.now(),
  });
  if (!doc) return NextResponse.json({ error: "invalid_document" }, { status: 400 });

  if (existing) {
    docs[docs.indexOf(existing)] = doc;
  } else {
    docs.push(doc);
  }
  await writeDocs(a.sub, docs);
  return NextResponse.json({ document: doc });
}

/** Rename a document. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const a = await authed(req);
  if (a.error) return a.error;
  const { id } = await params;

  let title = "";
  try {
    const body = (await req.json()) as { title?: unknown };
    title = typeof body.title === "string" ? body.title : "";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const docs = await readDocs(a.sub);
  const doc = docs.find((d) => d.id === id);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  doc.title = title.trim() || "Untitled resume";
  doc.updatedAt = Date.now();
  await writeDocs(a.sub, docs);
  return NextResponse.json({ document: doc });
}

/** Delete a document. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const a = await authed(req);
  if (a.error) return a.error;
  const { id } = await params;
  const docs = await readDocs(a.sub);
  const next = docs.filter((d) => d.id !== id);
  await writeDocs(a.sub, next);
  return NextResponse.json({ ok: true });
}
