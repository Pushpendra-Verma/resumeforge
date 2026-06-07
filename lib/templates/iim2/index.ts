import type { ResumeTemplate } from "../types";
import Iim2Template from "./Iim2Template";
import { getIim2Sample } from "./sample";

/** A classic serif variant of the IIM professional format. */
export const iim2Template: ResumeTemplate = {
  id: "iim-professional-2",
  name: "IIM Style Professional Resume 2",
  description:
    "Classic serif B-school format with full-width section bars, per-role gray bars with inline dates, labeled sub-groups, a four-column education grid and a contact footer. ATS-friendly.",
  tag: "Serif",
  accent: "#8a1c1c",
  rootClassName: "tpl-iim2",
  Renderer: Iim2Template,
  sample: getIim2Sample,
};
