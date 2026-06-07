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
 * timestamps. Documents are stored per-user (namespaced by Google account id)
 * in localStorage, so multiple accounts on one machine never collide and a
 * user can keep many resumes.
 *
 * This module owns ALL persistence and is completely template-agnostic — it
 * only records which template id a document uses.
 */
export interface ResumeDocument {
  id: string;
  title: string;
  templateId: string;
  resume: Resume;
  createdAt: number;
  updatedAt: number;
}

const keyFor = (sub: string) => `goodresume:user:${sub}:documents:v1`;

function readAll(sub: string): ResumeDocument[] {
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

function writeAll(sub: string, docs: ResumeDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(sub), JSON.stringify(docs));
  } catch {
    /* quota / private-mode errors are non-fatal */
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
    resume,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
  };
}

/** All of a user's documents, most-recently-updated first. */
export function listDocuments(sub: string): ResumeDocument[] {
  return readAll(sub).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDocument(sub: string, id: string): ResumeDocument | null {
  return readAll(sub).find((d) => d.id === id) ?? null;
}

/** A blank resume seeded with the signed-in user's name / email. */
export function starterResume(user: Pick<GoogleUser, "name" | "email">): Resume {
  const resume = emptyResume();
  if (user.name && user.name !== "Guest") resume.personalInfo.name = user.name;
  if (user.email) resume.personalInfo.email = user.email;
  return resume;
}

export function createDocument(
  sub: string,
  opts: { title?: string; templateId?: string; resume?: Resume },
): ResumeDocument {
  const now = Date.now();
  const doc: ResumeDocument = {
    id: uid("doc"),
    title: (opts.title ?? "").trim() || "Untitled resume",
    templateId: getTemplate(opts.templateId).id,
    resume: opts.resume ?? emptyResume(),
    createdAt: now,
    updatedAt: now,
  };
  const docs = readAll(sub);
  docs.push(doc);
  writeAll(sub, docs);
  return doc;
}

/** Upsert a document, stamping `updatedAt`. */
export function saveDocument(sub: string, doc: ResumeDocument): ResumeDocument {
  const next = { ...doc, updatedAt: Date.now() };
  const docs = readAll(sub);
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = next;
  else docs.push(next);
  writeAll(sub, docs);
  return next;
}

export function renameDocument(sub: string, id: string, title: string): void {
  const docs = readAll(sub);
  const doc = docs.find((d) => d.id === id);
  if (!doc) return;
  doc.title = title.trim() || "Untitled resume";
  doc.updatedAt = Date.now();
  writeAll(sub, docs);
}

export function duplicateDocument(sub: string, id: string): ResumeDocument | null {
  const source = getDocument(sub, id);
  if (!source) return null;
  return createDocument(sub, {
    title: `${source.title} (copy)`,
    templateId: source.templateId,
    resume: cloneResume(source.resume),
  });
}

export function deleteDocument(sub: string, id: string): void {
  writeAll(
    sub,
    readAll(sub).filter((d) => d.id !== id),
  );
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
 * has no documents yet, so it never overwrites real work:
 *  1. Import any pre-auth single-resume autosave from this browser (so earlier
 *     work isn't lost now that the app has accounts).
 *  2. Otherwise, the owner account starts with the prefilled sample resume.
 */
export function seedInitialDocuments(user: Pick<GoogleUser, "sub" | "email">): void {
  if (readAll(user.sub).length > 0) return;

  const legacy = loadResume();
  if (legacy) {
    createDocument(user.sub, {
      title: "IIM Style Professional Resume",
      templateId: DEFAULT_TEMPLATE_ID,
      resume: legacy,
    });
    clearResume();
    return;
  }

  if (user.email && user.email.trim().toLowerCase() === OWNER_EMAIL) {
    createDocument(user.sub, {
      title: "IIM Style Professional Resume",
      templateId: DEFAULT_TEMPLATE_ID,
      resume: getSampleResume(),
    });
  }
}
