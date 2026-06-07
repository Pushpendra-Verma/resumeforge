import type { Resume } from "@/lib/schema";
import { getTemplate } from "@/lib/templates/registry";

/**
 * Renders a resume with the chosen template. This is the one place the rest of
 * the app goes through to draw a resume — the editor preview, the dashboard
 * thumbnails, the landing showcase and the PDF export all use it, so they all
 * pick up new templates for free.
 */
export default function TemplatedResume({
  templateId,
  resume,
  id,
}: {
  templateId: string;
  resume: Resume;
  id?: string;
}) {
  const { Renderer } = getTemplate(templateId);
  return <Renderer resume={resume} id={id} />;
}
