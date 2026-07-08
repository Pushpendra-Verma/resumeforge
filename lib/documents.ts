import {
  cloneResume,
  emptyResume,
  normalizeResume,
  type Resume,
} from "./schema";
import { uid } from "./id";
import { getSampleResume } from "./sampleResume";
import { DEFAULT_TEMPLATE_ID } from "./templates/constants";
import { getTemplate } from "./templates/registry";
import { loadResume, clearResume } from "./storage";
import type { GoogleUser } from "./auth/google";

/**
 * Document store
 * --------------
 * A "document" is one resume the user is working on: its content (the shared
 * {@link Resume} schema), the template it's rendered with, plus a title and
 * timestamps.
 *
 * Persistence is CLOUD-FIRST so resumes follow a user across devices:
 *   • The source of truth is the Vercel-native API (`/api/documents`, backed by
 *     Postgres), keyed by the user's verified Google account id (session cookie).
 *   • localStorage is kept as a fast local cache and an offline fallback.
 *
 * If the backend isn't configured/reachable (e.g. before the KV store is
 * provisioned, or for the local demo "guest" session), every function silently
 * falls back to localStorage — so the app keeps working exactly as before.
 *
 * All functions are async. They're template-agnostic — a document only records
 * which template id it uses.
 */
export interface ResumeDocument {
  id: string;
  title: string;
  templateId: string;
  /** Uniform font scale (multiplier) for the whole resume. 1 = template default. */
  fontScale?: number;
  resume: Resume;
  createdAt: number;
  updatedAt: number;
}

/** Matches the guest sub minted in AuthProvider — this session stays local-only. */
const GUEST_SUB = "local-guest";
const isCloud = (sub: string) => sub !== GUEST_SUB;

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Keep the font scale within a sane range. */
export function clampFontScale(value: unknown): number {
  const n = typeof value === "number" && isFinite(value) ? value : 1;
  return Math.min(1.6, Math.max(0.6, n));
}

// --- Local cache (localStorage) -------------------------------------------

const keyFor = (sub: string) => `goodresume:user:${sub}:documents:v1`;
const migratedKey = (sub: string) => `goodresume:user:${sub}:migrated:v1`;

function readCache(sub: string): ResumeDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(sub));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeDocument)
      .filter((d): d is ResumeDocument => d !== null);
  } catch {
    return [];
  }
}

function writeCache(sub: string, docs: ResumeDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(sub), JSON.stringify(docs));
  } catch {
    /* quota / private-mode errors are non-fatal */
  }
}

function upsertCache(sub: string, doc: ResumeDocument): void {
  const docs = readCache(sub);
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.push(doc);
  writeCache(sub, docs);
}

function hasMigrated(sub: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(migratedKey(sub)) === "1";
  } catch {
    return true;
  }
}

function markMigrated(sub: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(migratedKey(sub), "1");
  } catch {
    /* ignore */
  }
}

function normalizeDocument(input: unknown): ResumeDocument | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<ResumeDocument>;
  const resume = normalizeResume(raw.resume);
  if (!resume) return null;
  const now = Date.now();
  return {
    id: raw.id || uid("doc"),
    title: (raw.title ?? "").trim() || "Untitled resume",
    // Fall back to the default template if the stored id is unknown.
    templateId: getTemplate(raw.templateId).id,
    fontScale: clampFontScale(raw.fontScale),
    resume,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
  };
}

const byRecent = (a: ResumeDocument, b: ResumeDocument) => b.updatedAt - a.updatedAt;

/**
 * One-time carry-over of the very first single-resume autosave (pre-accounts)
 * into this user's document cache, so early work isn't lost.
 */
function ensureLegacyImported(sub: string): void {
  if (typeof window === "undefined") return;
  if (readCache(sub).length > 0) return;
  const legacy = loadResume();
  if (!legacy) return;
  const now = Date.now();
  writeCache(sub, [
    {
      id: uid("doc"),
      title: "IIM Style Professional Resume",
      templateId: DEFAULT_TEMPLATE_ID,
      fontScale: 1,
      resume: legacy,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  clearResume();
}

// --- Cloud helpers ---------------------------------------------------------

/** PUT (upsert) a document to the cloud. Returns true on success. */
async function pushDoc(doc: ResumeDocument): Promise<boolean> {
  try {
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(doc),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Public API ------------------------------------------------------------

/** All of a user's documents, most-recently-updated first. */
export async function listDocuments(sub: string): Promise<ResumeDocument[]> {
  ensureLegacyImported(sub);
  const local = readCache(sub).sort(byRecent);
  if (!isCloud(sub)) return local;

  try {
    const res = await fetch("/api/documents");
    if (!res.ok) return local; // 401 / 503 → local-only fallback
    const { documents } = (await res.json()) as { documents?: unknown[] };
    const cloud = (documents ?? [])
      .map(normalizeDocument)
      .filter((d): d is ResumeDocument => d !== null);

    let result = cloud;
    if (!hasMigrated(sub)) {
      // First cloud sync on this device: if the cloud is empty but we have
      // local resumes, upload them so they're not lost and appear elsewhere.
      if (cloud.length === 0 && local.length > 0) {
        await Promise.all(local.map(pushDoc));
        result = local;
      }
      markMigrated(sub);
    }
    writeCache(sub, result);
    return result.sort(byRecent);
  } catch {
    return local;
  }
}

export async function getDocument(
  sub: string,
  id: string,
): Promise<ResumeDocument | null> {
  const fromCache = () => readCache(sub).find((d) => d.id === id) ?? null;
  if (!isCloud(sub)) return fromCache();

  try {
    const res = await fetch(`/api/documents/${id}`);
    if (res.status === 404) return fromCache(); // may be an unsynced local doc
    if (!res.ok) return fromCache();
    const { document } = (await res.json()) as { document?: unknown };
    const doc = normalizeDocument(document);
    if (doc) upsertCache(sub, doc);
    return doc ?? fromCache();
  } catch {
    return fromCache();
  }
}

/** A blank resume seeded with the signed-in user's name / email. */
export function starterResume(user: Pick<GoogleUser, "name" | "email">): Resume {
  const resume = emptyResume();
  if (user.name && user.name !== "Guest") resume.personalInfo.name = user.name;
  if (user.email) resume.personalInfo.email = user.email;
  return resume;
}

export async function createDocument(
  sub: string,
  opts: { title?: string; templateId?: string; resume?: Resume },
): Promise<ResumeDocument> {
  const now = Date.now();
  const localDoc: ResumeDocument = {
    id: uid("doc"),
    title: (opts.title ?? "").trim() || "Untitled resume",
    templateId: getTemplate(opts.templateId).id,
    fontScale: 1,
    resume: opts.resume ?? emptyResume(),
    createdAt: now,
    updatedAt: now,
  };

  if (isCloud(sub)) {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          title: localDoc.title,
          templateId: localDoc.templateId,
          fontScale: localDoc.fontScale,
          resume: localDoc.resume,
        }),
      });
      if (res.ok) {
        const { document } = (await res.json()) as { document?: unknown };
        const doc = normalizeDocument(document) ?? localDoc;
        upsertCache(sub, doc);
        return doc;
      }
    } catch {
      /* fall through to local */
    }
  }

  upsertCache(sub, localDoc);
  return localDoc;
}

/** Upsert a document, stamping `updatedAt`. Writes cache first (optimistic). */
export async function saveDocument(
  sub: string,
  doc: ResumeDocument,
): Promise<ResumeDocument> {
  const next = { ...doc, updatedAt: Date.now() };
  upsertCache(sub, next);
  if (isCloud(sub)) await pushDoc(next);
  return next;
}

export async function renameDocument(
  sub: string,
  id: string,
  title: string,
): Promise<void> {
  const docs = readCache(sub);
  const doc = docs.find((d) => d.id === id);
  if (doc) {
    doc.title = title.trim() || "Untitled resume";
    doc.updatedAt = Date.now();
    writeCache(sub, docs);
  }
  if (isCloud(sub)) {
    try {
      await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title }),
      });
    } catch {
      /* cache already updated */
    }
  }
}

export async function duplicateDocument(
  sub: string,
  id: string,
): Promise<ResumeDocument | null> {
  const source = await getDocument(sub, id);
  if (!source) return null;
  return createDocument(sub, {
    title: `${source.title} (copy)`,
    templateId: source.templateId,
    resume: cloneResume(source.resume),
  });
}

export async function deleteDocument(sub: string, id: string): Promise<void> {
  writeCache(
    sub,
    readCache(sub).filter((d) => d.id !== id),
  );
  if (isCloud(sub)) {
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
    } catch {
      /* cache already updated */
    }
  }
}

/**
 * The owner's Google account whose dashboard is pre-seeded with the sample
 * resume. Override with NEXT_PUBLIC_OWNER_EMAIL, or change the fallback here.
 */
const OWNER_EMAIL = (
  process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "pushpendra.verma.3538@gmail.com"
)
  .trim()
  .toLowerCase();

/**
 * Seed a brand-new user's dashboard on first sign-in. Runs only when the user
 * has no documents yet (in the cloud or locally), so it never overwrites real
 * work. `listDocuments` above already carried over any legacy/local resumes.
 */
export async function seedInitialDocuments(
  user: Pick<GoogleUser, "sub" | "email">,
): Promise<void> {
  const existing = await listDocuments(user.sub);
  if (existing.length > 0) return;

  if (user.email && user.email.trim().toLowerCase() === OWNER_EMAIL) {
    await createDocument(user.sub, {
      title: "IIM Style Professional Resume",
      templateId: DEFAULT_TEMPLATE_ID,
      resume: getSampleResume(),
    });
  }
}
