"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Resume } from "@/lib/schema";
import TemplatedResume from "./TemplatedResume";

const PAGE_W = 794; // A4 width in px @96dpi (210mm)
const PAGE_H = (PAGE_W * 297) / 210; // one A4 page height at the same scale

/**
 * Renders a template scaled to fit its container width. Used everywhere a
 * resume needs to be shown but not printed: the editor's live preview, the
 * dashboard thumbnails and the landing showcase. The unscaled copy used for
 * PDF export lives in the Editor's hidden print root.
 */
export default function ResumePreview({
  templateId,
  resume,
  shadow = false,
  pageGuides = false,
  interactive = false,
}: {
  templateId: string;
  resume: Resume;
  shadow?: boolean;
  /** Draw dashed A4 page-break guides (editor only). */
  pageGuides?: boolean;
  /** When false, the preview ignores pointer events (thumbnails). */
  interactive?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ scale: 1, height: 0, raw: 0 });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const page = pageRef.current;
    if (!wrap || !page) return;
    const compute = () => {
      const scale = Math.min(1, wrap.clientWidth / PAGE_W);
      const raw = page.offsetHeight;
      setDims({ scale, height: raw * scale, raw });
    };
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    ro.observe(page);
    compute();
    return () => ro.disconnect();
  }, [resume, templateId]);

  // A dashed guide wherever the export would start a new A4 page.
  const tol = (PAGE_W / 210) * 2;
  const breaks = pageGuides ? Math.max(0, Math.ceil((dims.raw - tol) / PAGE_H) - 1) : 0;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: dims.height }}>
      <div
        ref={pageRef}
        className={
          "absolute left-1/2 top-0 " +
          (shadow ? "shadow-xl " : "") +
          (interactive ? "" : "pointer-events-none")
        }
        style={{
          width: PAGE_W,
          transform: `translateX(-50%) scale(${dims.scale})`,
          transformOrigin: "top center",
        }}
      >
        <TemplatedResume templateId={templateId} resume={resume} />

        {Array.from({ length: breaks }).map((_, i) => (
          <div
            key={i}
            className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-rose-400"
            style={{ top: (i + 1) * PAGE_H }}
          >
            <span className="absolute -top-[18px] right-0 rounded-t bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              Page {i + 2} ↓ (overflows A4)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
