import {
  makeBullet,
  makeEntry,
  type Resume,
  type Section,
  type SectionLayout,
  SCHEMA_VERSION,
  emptyPersonalInfo,
} from "./schema";

/**
 * parser.ts
 * ---------
 * Turns an uploaded PDF / DOCX into raw text, then structures that text into
 * the ResumeForge schema. Everything runs in the browser:
 *   - PDF  -> pdfjs-dist (extracts the embedded text layer)
 *   - DOCX -> mammoth (extracts raw text)
 *
 * Parsing is best-effort. Real-world resumes vary wildly, so the goal is to
 * produce a sensible *draft* the user then refines in the editor. The one hard
 * guarantee: whatever we extract is valid schema and therefore renders in the
 * locked template without ever affecting formatting.
 *
 * OCR note: pdfjs reads the text layer of digital PDFs. Purely scanned/image
 * PDFs have no text layer; `extractPdfText` detects that and throws a friendly
 * error. An OCR fallback (e.g. tesseract.js on the rendered page canvas) can be
 * plugged in at the marked extension point.
 */

export interface ParseResult {
  resume: Resume;
  rawText: string;
}

// ---------------------------------------------------------------------------
// File entry point
// ---------------------------------------------------------------------------

export async function parseResumeFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  let rawText: string;
  if (isPdf) {
    rawText = await extractPdfText(file);
  } else if (isDocx) {
    rawText = await extractDocxText(file);
  } else if (name.endsWith(".txt")) {
    rawText = await file.text();
  } else {
    throw new Error(
      "Unsupported file type. Please upload a PDF or DOCX resume.",
    );
  }

  const cleaned = rawText.replace(/\r/g, "").trim();
  if (!cleaned) {
    throw new Error(
      "No readable text was found. If this is a scanned/image PDF it has no text layer to extract.",
    );
  }

  return { resume: structureResume(cleaned), rawText: cleaned };
}

// ---------------------------------------------------------------------------
// PDF extraction (pdfjs-dist)
// ---------------------------------------------------------------------------

async function extractPdfText(file: File): Promise<string> {
  // Dynamic import keeps pdfjs out of the server bundle.
  const pdfjs = await import("pdfjs-dist");
  // Match the worker to the installed library version (no local copy needed).
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;

  const lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group text items into visual lines using their Y coordinate, then sort
    // each line left-to-right by X. This reconstructs reading order far better
    // than naive string concatenation.
    const rows = new Map<number, { x: number; w: number; h: number; str: string }[]>();
    for (const item of content.items as TextItem[]) {
      if (!("str" in item) || !item.str) continue;
      const y = Math.round(item.transform[5]);
      // Bucket Ys within 2px together to absorb sub-pixel jitter.
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      const bucket = rows.get(key) ?? [];
      bucket.push({
        x: item.transform[4],
        w: item.width ?? 0,
        h: item.height ?? 0,
        str: item.str,
      });
      rows.set(key, bucket);
    }

    [...rows.entries()]
      .sort((a, b) => b[0] - a[0]) // top of page first (PDF Y grows upward)
      .forEach(([, items]) => {
        const sorted = items.sort((a, b) => a.x - b.x);
        let line = "";
        let prevRight: number | null = null;
        for (const it of sorted) {
          if (prevRight !== null) {
            const gap = it.x - prevRight;
            // A wide horizontal gap is a COLUMN boundary — preserve it as a tab
            // so the structurer can recover table columns. Small gaps -> a space.
            // Without this, pdfjs' flattened text loses all column structure and
            // tables (e.g. Education) collapse into one cell.
            const colGap = (it.h || 8) * 0.9;
            line += gap > colGap ? "\t" : gap > -1 ? " " : "";
          }
          line += it.str;
          prevRight = it.x + (it.w || 0);
        }
        // Collapse stray double spaces but keep the tab column markers.
        line = line.replace(/ {2,}/g, " ").replace(/ ?\t ?/g, "\t").trim();
        if (line) lines.push(line);
      });
  }

  // --- OCR extension point ------------------------------------------------
  // if (lines.length === 0) { return await ocrPdf(file); }
  // ------------------------------------------------------------------------

  return lines.join("\n");
}

interface TextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// DOCX extraction (mammoth)
// ---------------------------------------------------------------------------

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
}

// ---------------------------------------------------------------------------
// Structuring: raw text -> Resume
// ---------------------------------------------------------------------------

const SECTION_PATTERNS: { re: RegExp; layout: SectionLayout; title: string }[] =
  [
    { re: /\b(educat|qualificat|academic)/i, layout: "table", title: "EDUCATION" },
    {
      re: /\b(professional experience|work experience|employment|experience|work history)/i,
      layout: "timeline",
      title: "PROFESSIONAL EXPERIENCE",
    },
    { re: /\binternship/i, layout: "timeline", title: "INTERNSHIPS" },
    { re: /\bprojects?\b/i, layout: "timeline", title: "PROJECTS" },
    {
      re: /\b(position[s]? of responsib|leadership|responsibilit)/i,
      layout: "list",
      title: "POSITIONS OF RESPONSIBILITY",
    },
    {
      re: /\b(achievement|accomplishment|award|honou?r)/i,
      layout: "list",
      title: "ACHIEVEMENTS",
    },
    {
      re: /\b(certificat|licen[cs]e)/i,
      layout: "list",
      title: "CERTIFICATIONS",
    },
    {
      re: /\b(extra.?curricular|co.?curricular|volunteer|activit)/i,
      layout: "list",
      title: "EXTRA-CURRICULAR ACTIVITIES",
    },
    { re: /\bskills?\b/i, layout: "list", title: "SKILLS" },
    { re: /\b(summary|objective|profile|about)\b/i, layout: "list", title: "SUMMARY" },
  ];

const BULLET_RE = /^\s*[•●▪‣◦·\-–—*]\s+/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /(linkedin\.com\/[\w/-]+|in\/[\w-]+)/i;
const URL_RE = /\b((https?:\/\/)?[\w-]+\.(?:com|org|net|io|dev|app|in|co)[\w/.-]*)\b/i;
// A date range like "Jul 2022 - Jan 2025" / "2017 – 2021" / "May 2019 - Present".
const DATE_RANGE_RE =
  /((?:[A-Za-z]{3,9}\.?\s*)?\d{4}\s*[-–—]+\s*(?:Present|Current|Ongoing|(?:[A-Za-z]{3,9}\.?\s*)?\d{4}))/i;
// Education-table column classifiers.
const YEAR_RE = /\b(?:19|20)\d{2}\b/;
const SCORE_RE =
  /(\d(?:\.\d+)?\s*\/\s*\d|\d{1,3}(?:\.\d+)?\s*%|\bpursuing\b|\bongoing\b|\bpresent\b|^\d(?:\.\d+)?$)/i;
const DEGREE_HINT_RE =
  /\b(b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|b\.?a|m\.?a|mba|bba|bca|mca|ph\.?d|diploma|cbse|icse|class|grade|10th|12th|hsc|ssc|intermediate|matriculation|bachelor|master|degree)\b/i;

function isSectionHeader(line: string): { layout: SectionLayout; title: string } | null {
  const t = line.trim();
  if (!t || BULLET_RE.test(t) || t.length > 60) return null;
  // Headers are short and either ALL CAPS or a small number of words.
  const words = t.split(/\s+/);
  const looksLikeHeader =
    t === t.toUpperCase() || words.length <= 5;
  if (!looksLikeHeader) return null;
  for (const pat of SECTION_PATTERNS) {
    if (pat.re.test(t)) return { layout: pat.layout, title: t.toUpperCase() };
  }
  return null;
}

function extractPersonalInfo(lines: string[]) {
  const info = emptyPersonalInfo();
  // First non-empty line is treated as the name.
  const first = lines.find((l) => l.trim().length > 0);
  if (first) info.name = first.trim();

  const head = lines.slice(0, 8).join("  ");
  info.email = head.match(EMAIL_RE)?.[0] ?? "";
  info.phone = head.match(PHONE_RE)?.[0]?.trim() ?? "";
  info.linkedin = head.match(LINKEDIN_RE)?.[0] ?? "";
  const url = head.match(URL_RE)?.[0];
  if (url && !info.linkedin.includes(url) && !info.email.includes(url)) {
    info.website = url;
  }
  // Headline: a short second line that isn't contact info, a date, or numeric
  // data (which would otherwise pull stray year/score text into the headline).
  const second = lines[1]?.trim().replace(/\t+/g, " ") ?? "";
  const looksLikeData =
    EMAIL_RE.test(second) ||
    PHONE_RE.test(second) ||
    DATE_RANGE_RE.test(second) ||
    /\d{4}/.test(second);
  if (second && !looksLikeData && second.length <= 40) {
    info.headline = second.replace(/\|/g, "").trim();
  }
  return info;
}

/** Split a timeline header line into role / org / dates. */
function splitTimelineHeader(line: string) {
  let rest = line.trim();
  let dateRange = "";
  const dm = rest.match(DATE_RANGE_RE);
  if (dm) {
    dateRange = dm[0].replace(/\s+/g, " ").trim();
    rest = rest.replace(dm[0], "").trim();
  }
  // Prefer a column gap recovered from the PDF (a tab) to separate role / org;
  // otherwise fall back to "Role at Company", "Role, Company", "Role | Company".
  let title = rest;
  let organization = "";
  const tabIdx = rest.indexOf("\t");
  if (tabIdx >= 0) {
    title = rest.slice(0, tabIdx).trim();
    organization = rest.slice(tabIdx + 1).replace(/\t+/g, " ").trim();
  } else {
    const sep = rest.match(/\s+(?:at|@|\||,|—|–|-)\s+/);
    if (sep && sep.index !== undefined) {
      title = rest.slice(0, sep.index).trim();
      organization = rest.slice(sep.index + sep[0].length).trim();
    }
  }
  return { title: title.replace(/\t+/g, " ").trim(), organization, dateRange };
}

type EduRow =
  | { frag: string }
  | { title: string; dateRange: string; organization: string; location: string };

/**
 * Parse one Education-table line into Degree / Year / Institute / Score.
 * Columns arrive tab-separated (recovered from the PDF's column gaps). Year and
 * score are matched by pattern rather than position so column order can vary.
 * A lone fragment with no year/degree is a wrapped institute-name continuation
 * (e.g. a long institute spilling onto a second line as "… Surat"); the caller
 * decides which row it belongs to.
 */
function parseEduLine(line: string): EduRow {
  const cols = line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);

  if (cols.length === 1 && !YEAR_RE.test(cols[0]) && !DEGREE_HINT_RE.test(cols[0])) {
    return { frag: cols[0] };
  }

  const yearIdx = cols.findIndex((c) => YEAR_RE.test(c) && c.length <= 16);
  const scoreIdx = cols.findIndex((c, i) => i !== yearIdx && SCORE_RE.test(c));
  const rest = cols.filter((_, i) => i !== yearIdx && i !== scoreIdx);

  return {
    title: rest[0] ?? cols[0] ?? line,
    dateRange: yearIdx >= 0 ? cols[yearIdx] : "",
    organization: rest.slice(1).join(" "),
    location: scoreIdx >= 0 ? cols[scoreIdx] : "",
  };
}

function structureResume(text: string): Resume {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const personalInfo = extractPersonalInfo(lines);
  const sections: Section[] = [];

  // Find the index where the first recognised section begins; everything
  // before it is the header/contact block already captured above.
  let startIdx = lines.findIndex((l) => isSectionHeader(l));
  if (startIdx < 0) startIdx = lines.length;

  let current: Section | null = null;

  // Buffered institute-name fragments (wrapped 2nd lines) awaiting a home row.
  let pendingInst: string[] = [];
  const flushPending = () => {
    if (current?.layout === "table" && pendingInst.length && current.entries.length) {
      const last = current.entries[current.entries.length - 1];
      last.organization = `${last.organization} ${pendingInst.join(" ")}`.trim();
    }
    pendingInst = [];
  };

  const pushBullet = (text: string) => {
    if (!current) {
      current = { id: "s_misc", title: "SUMMARY", layout: "list", entries: [makeEntry()] };
      sections.push(current);
    }
    const entry =
      current.entries[current.entries.length - 1] ??
      (current.entries.push(makeEntry()), current.entries[current.entries.length - 1]);
    entry.bullets.push(makeBullet(text));
  };

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const header = isSectionHeader(line);

    if (header) {
      flushPending(); // any trailing fragment belongs to the section we're leaving
      current = {
        id: `s_${header.title.toLowerCase().replace(/[^a-z]+/g, "_")}`,
        title: header.title,
        layout: header.layout,
        entries: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;

    const isBullet = BULLET_RE.test(line);
    // Bullet/body text never needs the tab column markers — flatten them.
    const clean = line
      .replace(BULLET_RE, "")
      .replace(/\t+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!clean) continue;

    if (current.layout === "list") {
      pushBullet(clean);
      continue;
    }

    if (current.layout === "table") {
      const row = parseEduLine(line);
      if ("frag" in row) {
        pendingInst.push(row.frag);
      } else {
        // Place buffered institute fragments: into THIS row if its own institute
        // cell is empty (the name wrapped above its degree line), otherwise onto
        // the PREVIOUS row (the name wrapped below its degree line).
        if (pendingInst.length) {
          if (!row.organization) {
            row.organization = pendingInst.join(" ");
          } else if (current.entries.length) {
            const prev = current.entries[current.entries.length - 1];
            prev.organization = `${prev.organization} ${pendingInst.join(" ")}`.trim();
          }
          pendingInst = [];
        }
        current.entries.push(makeEntry(row));
      }
      continue;
    }

    // timeline
    if (isBullet) {
      if (current.entries.length === 0) current.entries.push(makeEntry());
      current.entries[current.entries.length - 1].bullets.push(makeBullet(clean));
    } else {
      // A non-bullet line with a date range, or short Title-Case text, starts
      // a new entry; otherwise treat it as a bullet of the current entry.
      const hasDate = DATE_RANGE_RE.test(line);
      const looksHeader = hasDate || line.split(/\s+/).length <= 8;
      if (looksHeader) {
        current.entries.push(makeEntry(splitTimelineHeader(line)));
      } else if (current.entries.length) {
        current.entries[current.entries.length - 1].bullets.push(makeBullet(clean));
      } else {
        current.entries.push(makeEntry({ title: clean }));
      }
    }
  }
  flushPending(); // trailing fragment in a table that ends the document

  // Drop empty entries left behind by headers with no following content.
  for (const s of sections) {
    s.entries = s.entries.filter(
      (e) => e.title || e.organization || e.dateRange || e.bullets.length,
    );
    if (s.entries.length === 0) s.entries.push(makeEntry());
  }

  return {
    version: SCHEMA_VERSION,
    personalInfo,
    sections: sections.length ? sections : structureFallback(lines),
  };
}

/** If no sections were recognised, dump everything into one editable list. */
function structureFallback(lines: string[]): Section[] {
  return [
    {
      id: "s_content",
      title: "CONTENT",
      layout: "list",
      entries: [
        makeEntry({
          bullets: lines.slice(1).map((l) => makeBullet(l.replace(BULLET_RE, "").trim())),
        }),
      ],
    },
  ];
}
