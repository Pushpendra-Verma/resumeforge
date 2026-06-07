import { uid } from "./id";

/**
 * ResumeForge schema
 * ------------------
 * The schema describes CONTENT ONLY. It contains no fonts, colors, margins,
 * sizes or any other presentation concern. All appearance lives exclusively
 * in the template renderers (see lib/templates/). This separation is what lets
 * the same content render in any template, and guarantees that editing content
 * can never break a template's design.
 *
 * A resume is an ordered list of `Section`s. Each section has a `layout`
 * that tells the renderer how to draw it, but the layout is a fixed enum —
 * the user picks *which* of the three locked layouts a section uses, never
 * how that layout looks.
 */

/** The fixed presentation shapes a template knows how to draw. */
export type SectionLayout =
  | "table" // bordered grid, e.g. Education (Degree | Year | Institute | Score)
  | "timeline" // role / org / dates header + bullets, e.g. Experience
  | "list" // optional subheading + bullets, e.g. Achievements / Certifications
  | "grouped"; // labeled sub-groups: a left label cell + its bullets (2-column grid)

export interface Bullet {
  id: string;
  text: string;
}

/**
 * A single entry within a section. The four header fields are generic on
 * purpose; their *meaning* depends on the section's layout (see FIELD_LABELS),
 * but their *rendering* is always fixed by the template.
 */
export interface Entry {
  id: string;
  title: string; // timeline: Role  | table: Degree   | list: optional subheading
  organization: string; // timeline: Org   | table: Institute | list: (unused)
  dateRange: string; // timeline: Dates | table: Year     | list: (unused)
  location: string; // timeline: Place | table: Score    | list: (unused)
  bullets: Bullet[];
}

export interface Section {
  id: string;
  title: string; // editable heading shown in the gray bar, e.g. "ACHIEVEMENTS"
  layout: SectionLayout;
  /** Optional right-aligned date shown on the section bar (used by some templates). */
  dateRange?: string;
  entries: Entry[];
}

export interface PersonalInfo {
  name: string;
  headline: string; // e.g. "M.B.A. 2027"
  email: string;
  phone: string;
  linkedin: string;
  website: string;
  location: string;
  logoText: string; // right-hand institute / brand label (alt text + text fallback)
  logoSrc: string; // right-hand logo image URL (e.g. "/iimv_logo.png"); preferred over logoText
}

export interface Resume {
  /** Bumped when the schema shape changes so old autosaves can be migrated. */
  version: number;
  personalInfo: PersonalInfo;
  sections: Section[];
}

export const SCHEMA_VERSION = 1;

/** Editor-facing labels for an entry's four generic fields, per layout. */
export const FIELD_LABELS: Record<
  SectionLayout,
  { title: string; organization: string; dateRange: string; location: string }
> = {
  table: {
    title: "Degree / Qualification",
    organization: "Institute",
    dateRange: "Year",
    location: "Score / %",
  },
  timeline: {
    title: "Role / Title",
    organization: "Organization",
    dateRange: "Duration",
    location: "Location",
  },
  list: {
    title: "Subheading (optional)",
    organization: "",
    dateRange: "",
    location: "",
  },
  grouped: {
    title: "Group label",
    organization: "",
    dateRange: "",
    location: "",
  },
};

export const LAYOUT_LABELS: Record<SectionLayout, string> = {
  table: "Table (Education-style)",
  timeline: "Timeline (Experience-style)",
  list: "List (Bullets / Achievements)",
  grouped: "Grouped (Label + bullets)",
};

/** Which entry fields a given layout actually uses. */
export function fieldsForLayout(layout: SectionLayout): (keyof Pick<
  Entry,
  "title" | "organization" | "dateRange" | "location"
>)[] {
  if (layout === "list" || layout === "grouped") return ["title"];
  return ["title", "organization", "dateRange", "location"];
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export function makeBullet(text = ""): Bullet {
  return { id: uid("b"), text };
}

export function makeEntry(partial: Partial<Entry> = {}): Entry {
  return {
    id: uid("e"),
    title: "",
    organization: "",
    dateRange: "",
    location: "",
    bullets: [],
    ...partial,
  };
}

export function makeSection(
  layout: SectionLayout = "list",
  title = "New Section",
): Section {
  return {
    id: uid("s"),
    title,
    layout,
    entries: [makeEntry({ bullets: [makeBullet("")] })],
  };
}

export function emptyPersonalInfo(): PersonalInfo {
  return {
    name: "Your Name",
    headline: "",
    email: "",
    phone: "",
    linkedin: "",
    website: "",
    location: "",
    logoText: "",
    logoSrc: "",
  };
}

export function emptyResume(): Resume {
  return {
    version: SCHEMA_VERSION,
    personalInfo: emptyPersonalInfo(),
    sections: [
      makeSection("table", "EDUCATION"),
      makeSection("timeline", "EXPERIENCE"),
    ],
  };
}

/** Deep clone helper — used by the undo/redo history and duplicate actions. */
export function cloneResume(resume: Resume): Resume {
  if (typeof structuredClone === "function") return structuredClone(resume);
  return JSON.parse(JSON.stringify(resume));
}

/** Duplicate an entry with fresh IDs (for the "Duplicate" action). */
export function duplicateEntry(entry: Entry): Entry {
  return {
    ...entry,
    id: uid("e"),
    bullets: entry.bullets.map((b) => ({ id: uid("b"), text: b.text })),
  };
}

/** Migrate / validate a parsed-from-storage object into a safe Resume. */
export function normalizeResume(input: unknown): Resume | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<Resume>;
  if (!Array.isArray(raw.sections) || !raw.personalInfo) return null;
  const personalInfo = { ...emptyPersonalInfo(), ...raw.personalInfo };
  // Migration: the seeded IIM resume predates the logo image field — restore it.
  if (!personalInfo.logoSrc && /institute of management/i.test(personalInfo.logoText)) {
    personalInfo.logoSrc = "/iimv_logo.png";
  }
  return {
    version: SCHEMA_VERSION,
    personalInfo,
    sections: raw.sections.map((s) => ({
      id: s.id || uid("s"),
      title: s.title ?? "Section",
      layout: (["table", "timeline", "list", "grouped"] as const).includes(s.layout)
        ? s.layout
        : "list",
      dateRange: typeof s.dateRange === "string" ? s.dateRange : "",
      entries: Array.isArray(s.entries)
        ? s.entries.map((e) => ({
            id: e.id || uid("e"),
            title: e.title ?? "",
            organization: e.organization ?? "",
            dateRange: e.dateRange ?? "",
            location: e.location ?? "",
            bullets: Array.isArray(e.bullets)
              ? e.bullets.map((b) => ({ id: b.id || uid("b"), text: b.text ?? "" }))
              : [],
          }))
        : [],
    })),
  };
}
