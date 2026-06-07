import React from "react";
import type { Section } from "@/lib/schema";
import type { TemplateRendererProps } from "../types";
import { HeaderLogo, hrefFor, LinkedInGlyph, rich } from "../shared";

/**
 * IIM Style Professional Resume
 * -----------------------------
 * The classic single-column, bordered B-school format: a ruled header with a
 * right-aligned institute logo, gray section bars, an Education grid, and
 * ruled timeline entries.
 *
 * It receives CONTENT ONLY. Every appearance rule lives in globals.css under
 * `.tpl-iim`, so editing content can never change the design, and this
 * template's styles can never leak into another template.
 */
export default function IimTemplate({ resume, id }: TemplateRendererProps) {
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
    <div className="resume-page tpl-iim" id={id}>
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

        {sections.map((section) => (
          <section className="resume-section" key={section.id}>
            <div className="resume-bar">
              <span>{section.title}</span>
              {section.dateRange?.trim() ? (
                <span className="resume-bar-dates">{section.dateRange.trim()}</span>
              ) : null}
            </div>
            <SectionBody section={section} />
          </section>
        ))}
      </div>
    </div>
  );
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
