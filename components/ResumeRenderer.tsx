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
  const contact = [p.headline, p.email, p.phone, p.website, p.location]
    .map((s) => s?.trim())
    .filter(Boolean);

  return (
    <div className="resume-page" id={id}>
      {/* Bordered frame — the page rule that wraps all content */}
      <div className="resume-frame">
        {/* Header */}
        <header className="resume-header">
          <div className="resume-headmain">
            <h1 className="resume-name">
              <span>{p.name || "Your Name"}</span>
              {p.linkedin?.trim() ? <LinkedInGlyph /> : null}
            </h1>
            {contact.length > 0 && (
              <p className="resume-contact">{contact.join("  |  ")}</p>
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

/**
 * Renders inline emphasis: any text wrapped in **double asterisks** becomes
 * <strong> (Poppins SemiBold, per the locked template). Everything else is
 * plain text — React escapes it, so this is XSS-safe.
 */
function rich(text: string): React.ReactNode {
  if (!text) return null;
  if (!text.includes("**")) return text;
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    return m ? (
      <strong key={i}>{m[1]}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
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
