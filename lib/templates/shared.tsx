import React from "react";

/**
 * Shared, template-agnostic rendering helpers.
 *
 * These turn the plain strings stored in the schema into safe, rich markup:
 *  - **double asterisks** become <strong>
 *  - URLs / emails become clickable <a> (also clickable in the exported PDF)
 *
 * Every template reuses these so the content behaves identically no matter
 * how it's styled. Nothing here decides fonts, colors or layout.
 */

/** Normalise a raw contact/URL string into a valid href. */
export function hrefFor(token: string): string {
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(token)) return `mailto:${token}`;
  if (/^https?:\/\//i.test(token)) return token;
  if (/^mailto:|^tel:/i.test(token)) return token;
  return `https://${token.replace(/^\/+/, "")}`;
}

// Matches URLs, emails and bare domains (with a known TLD) inside body text.
const LINK_RE =
  /(https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|io|dev|app|xyz)(?:\/[^\s]*)?)/gi;

/** Turn URLs/emails inside a plain string into clickable <a> elements. */
function linkify(text: string, kp: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    const trail = token.match(/[.,;:)\]}'"]+$/)?.[0] ?? "";
    const url = trail ? token.slice(0, -trail.length) : token;
    out.push(
      <a key={`${kp}-${i++}`} href={hrefFor(url)} target="_blank" rel="noopener noreferrer">
        {url}
      </a>,
    );
    if (trail) out.push(trail);
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Render content text with inline emphasis (**bold**) and auto-linked
 * URLs / emails. Everything else stays plain text — React escapes it, so
 * this is XSS-safe.
 */
export function rich(text: string): React.ReactNode {
  if (!text) return null;
  const segs = text.includes("**") ? text.split(/(\*\*[^*]+\*\*)/g) : [text];
  return segs.map((seg, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(seg);
    const nodes = linkify(bold ? bold[1] : seg, `r${i}`);
    return bold ? (
      <strong key={i}>{nodes}</strong>
    ) : (
      <React.Fragment key={i}>{nodes}</React.Fragment>
    );
  });
}

/** Inline LinkedIn glyph used in headers. Inherits `currentColor`. */
export function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="LinkedIn">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/** Derive up-to-three uppercase initials from a label, for text logos. */
export function initialsOf(text: string): string {
  return (
    text
      .split(/\s+/)
      .map((w) => w[0])
      .filter((c) => c && /[A-Z]/.test(c))
      .join("")
      .slice(0, 3) || "•"
  );
}

/**
 * The header's right-hand logo slot, shared by all templates so the behaviour
 * is consistent (this is core functionality, not a per-template choice):
 *  - a logo image was provided  → show the image
 *  - only an institute name      → show the name as plain text (no emblem)
 *  - nothing                     → render nothing
 */
export function HeaderLogo({ src, text }: { src?: string; text?: string }) {
  if (src?.trim()) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={text || "logo"} className="resume-logo-img" />;
  }
  if (text?.trim()) {
    return (
      <div className="resume-logo">
        <span className="resume-logo-text">{text}</span>
      </div>
    );
  }
  return null;
}
