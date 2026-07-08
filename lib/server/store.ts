import { Redis } from "@upstash/redis";

/**
 * Per-user document storage on Vercel-native KV (Upstash Redis).
 *
 * Each user's resumes are stored as one JSON array under `gr:docs:<sub>`, where
 * `sub` is the VERIFIED Google account id from the session cookie. Resumes are
 * small, and a user only has a handful, so a single blob per user is simple and
 * cheap. This module is intentionally storage-only: identity/authorization is
 * enforced by the API routes (see lib/server/session.ts) before it's ever called.
 *
 * When the KV env vars aren't present (e.g. before the store is provisioned in
 * Vercel), `getRedis()` returns null and the API reports "not configured" so the
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

let cached: Redis | null | undefined;

function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  // Support both the Vercel KV integration env names and Upstash's own.
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}

export function storeConfigured(): boolean {
  return getRedis() !== null;
}

const keyFor = (sub: string) => `gr:docs:${sub}`;

export async function readDocs(sub: string): Promise<StoredDoc[]> {
  const redis = getRedis();
  if (!redis) return [];
  const docs = await redis.get<StoredDoc[]>(keyFor(sub));
  return Array.isArray(docs) ? docs : [];
}

export async function writeDocs(sub: string, docs: StoredDoc[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(keyFor(sub), docs);
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
