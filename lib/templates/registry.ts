import type { ResumeTemplate } from "./types";
import { DEFAULT_TEMPLATE_ID } from "./constants";
import { iimTemplate } from "./iim";

export { DEFAULT_TEMPLATE_ID } from "./constants";

/**
 * The single registry of available templates.
 *
 * To add a template: build its module under `lib/templates/<id>/`, then append
 * it here. Everything else — the picker, switcher, dashboard previews, editor
 * and PDF export — works automatically because they all read from this list.
 */
export const TEMPLATES: ResumeTemplate[] = [iimTemplate];

const TEMPLATE_MAP: Record<string, ResumeTemplate> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
);

/** Resolve a template by id, always returning a valid template (default fallback). */
export function getTemplate(id?: string): ResumeTemplate {
  return (id && TEMPLATE_MAP[id]) || TEMPLATE_MAP[DEFAULT_TEMPLATE_ID];
}

/** All templates, for pickers and switchers. */
export function listTemplates(): ResumeTemplate[] {
  return TEMPLATES;
}
