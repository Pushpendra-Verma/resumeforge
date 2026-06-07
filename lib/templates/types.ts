import type { ComponentType } from "react";
import type { Resume } from "@/lib/schema";

/**
 * Template system
 * ---------------
 * A template is PURELY a way to PRESENT a {@link Resume}. Every template
 * consumes the exact same content schema and shares all business logic
 * (editing, undo/redo, autosave, PDF export). Templates differ only in
 * layout, colors, fonts and visual styling — never in data shape.
 *
 * Adding a new template = create a Renderer component + a CSS block scoped
 * to its `rootClassName`, then register it in `registry.ts`. No editor or
 * storage code needs to change.
 */

/** Props every template Renderer receives. Content in, markup out. */
export interface TemplateRendererProps {
  resume: Resume;
  /** Optional DOM id — the PDF exporter uses it to find the page root. */
  id?: string;
}

export interface ResumeTemplate {
  /** Stable identifier persisted on each document. Never change once shipped. */
  id: string;
  /** Human-facing name shown in the picker and switcher. */
  name: string;
  /** One-line description for the template picker. */
  description: string;
  /** Short tag, e.g. "Classic" / "Modern" / "Minimal". */
  tag: string;
  /** Accent color (hex) used for dashboard chips and the picker swatch. */
  accent: string;
  /**
   * Root class the Renderer puts on its `.resume-page` element. Each template's
   * CSS is scoped under this class so templates can never style each other.
   */
  rootClassName: string;
  /** The presentation component. */
  Renderer: ComponentType<TemplateRendererProps>;
  /**
   * Example content for this template — used for the picker/preview thumbnails
   * and to prefill a brand-new resume created from this template. Returns a
   * fresh copy (new ids) on each call.
   */
  sample: () => Resume;
}
