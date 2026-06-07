import type { ResumeTemplate } from "../types";
import { DEFAULT_TEMPLATE_ID } from "../constants";
import { getSampleResume } from "@/lib/sampleResume";
import IimTemplate from "./IimTemplate";

/** The original, locked design — now packaged as the first template. */
export const iimTemplate: ResumeTemplate = {
  id: DEFAULT_TEMPLATE_ID,
  name: "IIM Style Professional Resume",
  description:
    "Classic single-column B-school format with a bordered frame, ruled header, gray section bars and a clean education grid. ATS-friendly.",
  tag: "Classic",
  accent: "#0b3d2e",
  rootClassName: "tpl-iim",
  Renderer: IimTemplate,
  sample: getSampleResume,
};
