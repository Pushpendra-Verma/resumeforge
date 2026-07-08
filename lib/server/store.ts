import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Per-user document storage on a Vercel-native Postgres database (Neon).
 *
 * Neon has a free tier and integrates with Vercel in one click (Storage →
 * Create → Neon / Postgres). Its serverless HTTP driver needs no connection
 * pooling, so it's a clean fit for serverless API routes. Each user's resumes
 * are stored as one JSON (`jsonb`) blob keyed by the VERIFIED Google account id
 * (`sub`) from the session cookie — resumes are small and a user has only a
 * handful, so one row per user is simple and cheap.
 *
 * This module is storage-only: identity/authorization is enforced by the API
 * routes (see lib/server/session.ts) before it's ever called.
 *
 * When no database URL is configured (e.g. before the store is provisioned),
 * `storeConfigured()` is false and the API reports "not configured" so the
 * client falls back to local-only storage instead of erroring.
 */

/** A stored resume document. `resume` is the app's content JSON (opaque here). */
export interface StoredDoc {
  id: string;
  title: string;
  templateId: string;
  fontScale: number;
  resume: unknown;
  createdAt: number;
  updatedAt: number;
}

type Sql = NeonQueryFunction<false, false>;

let client: Sql | null | undefined;
let schemaReady: Promise<void> | null = null;

function getSql(): Sql | null {
  if (client !== undefined) return client;
  // Works with any Neon/Vercel Postgres connection string, whatever the
  // integration names it.
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    "";
  client = url ? neon(url) : null;
  return client;
}

export function storeConfigured(): boolean {
  return getSql() !== null;
}

/** Diagnostic: confirm the database is reachable. Returns null on success. */
export async function pingDb(): Promise<string | null> {
  const sql = getSql();
  if (!sql) return "no_connection_string";
  try {
    await sql`SELECT 1`;
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "unknown_error";
  }
}

/** Create the table on first use (idempotent). */
async function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS resume_docs (
          sub        TEXT PRIMARY KEY,
          docs       JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      schemaReady = null; // let a later call retry
      throw err;
    });
  }
  return schemaReady;
}

export async function readDocs(sub: string): Promise<StoredDoc[]> {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema(sql);
  const rows = (await sql`
    SELECT docs FROM resume_docs WHERE sub = ${sub}
  `) as { docs: StoredDoc[] }[];
  const docs = rows[0]?.docs;
  return Array.isArray(docs) ? docs : [];
}

export async function writeDocs(sub: string, docs: StoredDoc[]): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await ensureSchema(sql);
  await sql`
    INSERT INTO resume_docs (sub, docs, updated_at)
    VALUES (${sub}, ${JSON.stringify(docs)}::jsonb, now())
    ON CONFLICT (sub) DO UPDATE
      SET docs = EXCLUDED.docs, updated_at = now()
  `;
}

// --- Shape validation for anything coming off the wire --------------------

const clampScale = (v: unknown) =>
  typeof v === "number" && isFinite(v) ? Math.min(1.6, Math.max(0.6, v)) : 1;

/**
 * Coerce an untrusted request body into a StoredDoc. `id`/timestamps can be
 * forced by the caller (e.g. the server assigns them on create).
 */
export function coerceDoc(
  input: unknown,
  overrides: Partial<Pick<StoredDoc, "id" | "createdAt" | "updatedAt">> = {},
): StoredDoc | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (raw.resume === undefined || raw.resume === null) return null;
  const now = Date.now();
  return {
    id: overrides.id ?? (typeof raw.id === "string" ? raw.id : crypto.randomUUID()),
    title:
      (typeof raw.title === "string" ? raw.title : "").trim() ||
      "Untitled resume",
    templateId: typeof raw.templateId === "string" ? raw.templateId : "",
    fontScale: clampScale(raw.fontScale),
    resume: raw.resume,
    createdAt:
      overrides.createdAt ??
      (typeof raw.createdAt === "number" ? raw.createdAt : now),
    updatedAt: overrides.updatedAt ?? now,
  };
}
