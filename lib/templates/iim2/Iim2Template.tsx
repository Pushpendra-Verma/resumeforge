import React from "react";
import type { Section } from "@/lib/schema";
import type { TemplateRendererProps } from "../types";
import { hrefFor, initialsOf, LinkedInGlyph, rich } from "../shared";

/**
 * IIM Style Professional Resume 2
 * -------------------------------
 * A classic SERIF B-school format: a serif name header with a right-aligned
 * institute logo, full-width gray section bars, per-role gray entry bars with
 * inline dates, a four-column education grid, and a contact footer pinned to the
 * bottom of the page.
 *
 * Like every template it consumes CONTENT ONLY (the shared {@link Section}
 * schema). All appearance lives in globals.css under `.tpl-iim2`, scoped so it
 * can neither change content nor leak into other templates. It reuses the shared
 * rich-text / link helpers so editing behaviour is identical across templates.
 */
export default function Iim2Template({ resume, id }: TemplateRendererProps) {
  const { personalInfo: p, sections } = resume;

  // Footer contact line built as real elements so phone / email / website stay
  // clickable (and become clickable annotations in the exported PDF).
  const contactItems: { key: string; node: React.ReactNode }[] = [];
  if (p.phone?.trim())
    contactItems.push({
      key: "p",
      node: <a href={`tel:${p.phone.replace(/\s+/g, "")}`}>{p.phone.trim()}</a>,
    });
  if (p.location?.trim()) contactItems.push({ key: "l", node: p.location.trim() });
  if (p.email?.trim())
    contactItems.push({
      key: "e",
      node: <a href={`mailto:${p.email.trim()}`}>{p.email.trim()}</a>,
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

  return (
    <div className="resume-page tpl-iim2" id={id}>
      <div className="resume-frame">
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
                  <LinkedInGlyph className="resume-linkedin" />
                </a>
              ) : null}
            </h1>
            {p.headline?.trim() ? (
              <p className="resume-headline">{p.headline.trim()}</p>
            ) : null}
          </div>
          <HeaderLogo src={p.logoSrc} text={p.logoText} />
        </header>

        {sections.map((section) => (
          <section className="resume-section" key={section.id}>
            <div className="resume-bar">{section.title}</div>
            <SectionBody section={section} />
          </section>
        ))}

        {contactItems.length > 0 && (
          <footer className="resume-footer">
            {contactItems.map((c, i) => (
              <React.Fragment key={c.key}>
                {i > 0 && <span className="resume-foot-sep">•</span>}
                <span className="resume-foot-item">{c.node}</span>
              </React.Fragment>
            ))}
          </footer>
        )}
      </div>
    </div>
  );
}

function HeaderLogo({ src, text }: { src?: string; text?: string }) {
  if (src?.trim()) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={text || "logo"} className="resume-logo-img" />;
  }
  if (text?.trim()) {
    return (
      <div className="resume-logo">
        <span className="resume-logo-emblem">{initialsOf(text)}</span>
        <span className="resume-logo-text">{text}</span>
      </div>
    );
  }
  return null;
}

function SectionBody({ section }: { section: Section }) {
  if (section.layout === "table") {
    return (
      <table className="resume-table">
        <tbody>
          {section.entries.map((e) => (
            <tr key={e.id}>
              <td className="c-degree">{rich(e.title)}</td>
              <td className="c-inst">{rich(e.organization)}</td>
              <td className="c-detail">{rich(e.location)}</td>
              <td className="c-year">{rich(e.dateRange)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (section.layout === "timeline") {
    return (
      <>
        {section.entries.map((e) => {
          // Compose "Role — Organization, Location" for the gray entry bar.
          const head = [e.title, e.organization].filter((x) => x?.trim()).join(" — ");
          const headFull = e.location?.trim()
            ? head
              ? `${head}, ${e.location.trim()}`
              : e.location.trim()
            : head;
          return (
            <div className="resume-entry" key={e.id}>
              {(headFull || e.dateRange?.trim()) && (
                <div className="resume-entry-bar">
                  <span className="eb-role">{rich(headFull)}</span>
                  {e.dateRange?.trim() ? (
                    <span className="eb-dates">({e.dateRange.trim()})</span>
                  ) : null}
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
          );
        })}
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
