import React from "react";
import type { Resume, Section } from "@/lib/schema";

/**
 * ResumeRenderer — THE LOCKED TEMPLATE.
 *
 * This component is the single source of truth for how a resume looks. It
 * receives data only and emits markup with fixed template classes (defined in
 * globals.css under `.resume-page`). It has NO props that affect fonts, sizes,
 * spacing, colors, margins or layout. No matter what the user types in the
 * editor, the design that comes out here is identical.
 *
 * This same component is used for the live preview AND the print/PDF export,
 * which is why what you see is exactly what you export.
 */
export default function ResumeRenderer({
  resume,
  id,
}: {
  resume: Resume;
  id?: string;
}) {
  const { personalInfo: p, sections } = resume;

  // Contact line built as real elements so email / phone / website are
  // clickable links (and become clickable annotations in the exported PDF).
  const contactItems: { key: string; node: React.ReactNode }[] = [];
  if (p.headline?.trim()) contactItems.push({ key: "h", node: p.headline.trim() });
  if (p.email?.trim())
    contactItems.push({
      key: "e",
      node: <a href={`mailto:${p.email.trim()}`}>{p.email.trim()}</a>,
    });
  if (p.phone?.trim())
    contactItems.push({
      key: "p",
      node: <a href={`tel:${p.phone.replace(/\s+/g, "")}`}>{p.phone.trim()}</a>,
    });
  if (p.website?.trim())
    contactItems.push({
      key: "w",
      node: (
        <a href={hrefFor(p.website.trim())} target="_blank" rel="noopener noreferrer">
          {p.website.trim()}
        </a>
      ),
    });
  if (p.location?.trim()) contactItems.push({ key: "l", node: p.location.trim() });

  return (
    <div className="resume-page" id={id}>
      {/* Bordered frame — the page rule that wraps all content */}
      <div className="resume-frame">
        {/* Header */}
        <header className="resume-header">
          <div className="resume-headmain">
            <h1 className="resume-name">
              <span>{p.name || "Your Name"}</span>
              {p.linkedin?.trim() ? (
                <a
                  className="resume-linkedin-link"
                  href={hrefFor(p.linkedin.trim())}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                >
                  <LinkedInGlyph />
                </a>
              ) : null}
            </h1>
            {contactItems.length > 0 && (
              <p className="resume-contact">
                {contactItems.map((c, i) => (
                  <React.Fragment key={c.key}>
                    {i > 0 && <span className="resume-sep">{"  |  "}</span>}
                    {c.node}
                  </React.Fragment>
                ))}
              </p>
            )}
          </div>
          <HeaderLogo src={p.logoSrc} text={p.logoText} />
        </header>

        {/* Sections */}
        {sections.map((section) => (
          <section className="resume-section" key={section.id}>
            <div className="resume-bar">{section.title}</div>
            <SectionBody section={section} />
          </section>
        ))}
      </div>
    </div>
  );
}

function HeaderLogo({ src, text }: { src?: string; text?: string }) {
  if (src?.trim()) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={text || "logo"} className="resume-logo-img" />;
  }
  if (text?.trim()) return <Logo text={text} />;
  return null;
}

/** Normalise a raw contact/URL string into a valid href. */
function hrefFor(token: string): string {
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
 * Renders content text with:
 *  - inline emphasis: **double asterisks** → <strong> (Poppins SemiBold), and
 *  - auto-linked URLs / emails → clickable <a> (also clickable in the PDF).
 * Everything else stays plain text — React escapes it, so this is XSS-safe.
 */
function rich(text: string): React.ReactNode {
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

function SectionBody({ section }: { section: Section }) {
  if (section.layout === "table") {
    return (
      <table className="resume-table">
        <tbody>
          {section.entries.map((e) => (
            <tr key={e.id}>
              <td className="c-title">{rich(e.title)}</td>
              <td className="c-year">{rich(e.dateRange)}</td>
              <td className="c-org">{rich(e.organization)}</td>
              <td className="c-score">{rich(e.location)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (section.layout === "timeline") {
    return (
      <>
        {section.entries.map((e) => (
          <div className="resume-entry" key={e.id}>
            {(e.title || e.organization || e.dateRange) && (
              <div className="resume-entry-head">
                <span className="role">{rich(e.title)}</span>
                <span className="org">{rich(e.organization)}</span>
                <span className="dates">{rich(e.dateRange)}</span>
              </div>
            )}
            {e.bullets.length > 0 && (
              <ul className="resume-bullets">
                {e.bullets.map((b) => (
                  <li key={b.id}>{rich(b.text)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </>
    );
  }

  // list layout
  return (
    <>
      {section.entries.map((e) => (
        <div className="resume-entry" key={e.id}>
          {e.title?.trim() ? (
            <div className="resume-subhead">{rich(e.title)}</div>
          ) : null}
          {e.bullets.length > 0 && (
            <ul className="resume-bullets">
              {e.bullets.map((b) => (
                <li key={b.id}>{rich(b.text)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

function Logo({ text }: { text: string }) {
  const initials =
    text
      .split(/\s+/)
      .map((w) => w[0])
      .filter((c) => c && /[A-Z]/.test(c))
      .join("")
      .slice(0, 3) || "•";
  return (
    <div className="resume-logo">
      <span className="resume-logo-emblem">{initials}</span>
      <span className="resume-logo-text">{text}</span>
    </div>
  );
}

function LinkedInGlyph() {
  return (
    <svg className="resume-linkedin" viewBox="0 0 24 24" fill="currentColor" aria-label="LinkedIn">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
