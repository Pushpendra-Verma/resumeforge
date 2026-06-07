"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  duplicateEntry as cloneEntry,
  makeBullet,
  makeEntry,
  makeSection,
  type PersonalInfo,
  type Resume,
  type Section,
} from "@/lib/schema";
import { uid } from "@/lib/id";
import { getSampleResume } from "@/lib/sampleResume";
import { loadResume, saveResume } from "@/lib/storage";
import { useResumeHistory } from "@/lib/useResumeHistory";
import type { EntryTextField, SectionApi } from "./editorTypes";

import Toolbar, { type SaveState } from "./Toolbar";
import DragSection from "./DragSection";
import PersonalInfoEditor from "./PersonalInfoEditor";
import ResumeRenderer from "./ResumeRenderer";
import UploadZone from "./UploadZone";
import { Icon } from "./ui";

const PAGE_W = 794; // A4 width in px @96dpi (210mm) — matches the locked template

export default function Editor() {
  // Initialised on the client only (this component is loaded with ssr:false),
  // so the random IDs in the seed never cause hydration mismatches.
  const history = useResumeHistory(loadResume() ?? getSampleResume());
  const { resume, update, reset, undo, redo, canUndo, canRedo } = history;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // -- Autosave (debounced) -------------------------------------------------
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      saveResume(resume);
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [resume]);

  // -- Keyboard shortcuts: undo / redo --------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // -- Document mutations ---------------------------------------------------
  const setPersonal = useCallback(
    (field: keyof PersonalInfo, value: string) =>
      update((d) => {
        d.personalInfo[field] = value;
      }, `personal:${field}`),
    [update],
  );

  const addSection = useCallback(
    () =>
      update((d) => {
        d.sections.push(makeSection("list", "NEW SECTION"));
      }),
    [update],
  );

  const makeApi = useCallback(
    (sid: string): SectionApi => {
      const findSection = (d: Resume) => d.sections.find((s) => s.id === sid);
      const findEntry = (d: Resume, eid: string) =>
        findSection(d)?.entries.find((e) => e.id === eid);

      return {
        setTitle: (value) =>
          update((d) => {
            const s = findSection(d);
            if (s) s.title = value;
          }, `title:${sid}`),
        setLayout: (layout) =>
          update((d) => {
            const s = findSection(d);
            if (s) s.layout = layout;
          }),
        deleteSection: () =>
          update((d) => {
            d.sections = d.sections.filter((s) => s.id !== sid);
          }),
        duplicateSection: () =>
          update((d) => {
            const idx = d.sections.findIndex((s) => s.id === sid);
            if (idx < 0) return;
            d.sections.splice(idx + 1, 0, cloneSection(d.sections[idx]));
          }),
        addEntry: () =>
          update((d) => {
            const s = findSection(d);
            if (!s) return;
            s.entries.push(
              makeEntry({ bullets: s.layout === "table" ? [] : [makeBullet("")] }),
            );
          }),
        deleteEntry: (eid) =>
          update((d) => {
            const s = findSection(d);
            if (s) s.entries = s.entries.filter((e) => e.id !== eid);
          }),
        duplicateEntry: (eid) =>
          update((d) => {
            const s = findSection(d);
            if (!s) return;
            const idx = s.entries.findIndex((e) => e.id === eid);
            if (idx < 0) return;
            s.entries.splice(idx + 1, 0, cloneEntry(s.entries[idx]));
          }),
        setEntryField: (eid, field: EntryTextField, value) =>
          update((d) => {
            const e = findEntry(d, eid);
            if (e) e[field] = value;
          }, `field:${eid}:${field}`),
        addBullet: (eid) =>
          update((d) => {
            const e = findEntry(d, eid);
            if (e) e.bullets.push(makeBullet(""));
          }),
        deleteBullet: (eid, bid) =>
          update((d) => {
            const e = findEntry(d, eid);
            if (e) e.bullets = e.bullets.filter((b) => b.id !== bid);
          }),
        setBullet: (eid, bid, value) =>
          update((d) => {
            const b = findEntry(d, eid)?.bullets.find((x) => x.id === bid);
            if (b) b.text = value;
          }, `bullet:${bid}`),
        moveBullet: (eid, activeId, overId) =>
          update((d) => {
            const e = findEntry(d, eid);
            if (!e) return;
            const from = e.bullets.findIndex((b) => b.id === activeId);
            const to = e.bullets.findIndex((b) => b.id === overId);
            if (from < 0 || to < 0) return;
            e.bullets = arrayMove(e.bullets, from, to);
          }),
      };
    },
    [update],
  );

  // -- Section drag-and-drop ------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const onSectionDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      update((d) => {
        const from = d.sections.findIndex((s) => s.id === active.id);
        const to = d.sections.findIndex((s) => s.id === over.id);
        if (from < 0 || to < 0) return;
        d.sections = arrayMove(d.sections, from, to);
      });
    },
    [update],
  );

  // -- Upload / export ------------------------------------------------------
  const onParsed = useCallback(
    (parsed: Resume) => {
      reset(parsed);
      setSaveState("idle");
    },
    [reset],
  );

  /**
   * Download an A4 PDF that looks EXACTLY like the live preview, with no print
   * dialog. We render the real DOM with html-to-image (SVG foreignObject = the
   * browser's own engine), so tables/fonts/spacing match the preview pixel-for-
   * pixel — unlike html2canvas, which re-implements layout and breaks tables.
   *
   * The snapshot is placed at FULL page width (no side margins). If the content
   * is taller than one A4 page it is split across pages exactly where the
   * preview's page guides show — so what you see is what you get.
   */
  const onDownload = useCallback(async () => {
    const root = printRef.current;
    const page = root?.querySelector(".resume-page") as HTMLElement | null;
    if (!root || !page) return;
    setDownloading(true);

    // Reveal the clean copy off-screen so it has layout to be captured.
    const savedStyle = root.getAttribute("style") ?? "";
    root.style.cssText =
      "display:block;position:absolute;left:-10000px;top:0;width:210mm;background:#fff;";

    try {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      // Ensure Poppins is loaded so the snapshot uses the right font.
      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = await toCanvas(page, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWmm = pdf.internal.pageSize.getWidth(); // 210
      const pageHmm = pdf.internal.pageSize.getHeight(); // 297
      const pxPerMm = canvas.width / pageWmm; // full-width fit → no side margins
      const pageHpx = Math.floor(pageHmm * pxPerMm);

      // Slice the tall capture into A4-height pages (usually just one).
      // 2mm tolerance prevents a sliver second page from rounding noise.
      const tolPx = pxPerMm * 2;
      let offset = 0;
      let firstPage = true;
      while (offset < canvas.height - tolPx) {
        const sliceHpx = Math.min(pageHpx, canvas.height - offset);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHpx;
        const ctx = slice.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, offset, canvas.width, sliceHpx, 0, 0, canvas.width, sliceHpx);

        if (!firstPage) pdf.addPage();
        pdf.addImage(
          slice.toDataURL("image/png"),
          "PNG",
          0,
          0,
          pageWmm,
          sliceHpx / pxPerMm,
          undefined,
          "FAST",
        );
        offset += sliceHpx;
        firstPage = false;
      }

      const base =
        (resume.personalInfo.name || "resume")
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^\w-]/g, "") || "resume";
      pdf.save(`${base}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Sorry — generating the PDF failed. Please try again.");
    } finally {
      root.style.cssText = savedStyle;
      setDownloading(false);
    }
  }, [resume.personalInfo.name]);

  const sectionIds = useMemo(() => resume.sections.map((s) => s.id), [resume.sections]);

  return (
    <>
      <div className="app-shell flex min-h-screen flex-col">
        <Toolbar
          canUndo={canUndo}
        canRedo={canRedo}
        saveState={saveState}
        previewMode={previewMode}
        onUndo={undo}
        onRedo={redo}
        onUpload={() => setUploadOpen(true)}
        onAddSection={addSection}
        onTogglePreview={() => setPreviewMode((p) => !p)}
        onDownload={onDownload}
        downloading={downloading}
      />

      {previewMode ? (
        <main className="flex-1 overflow-auto bg-slate-200/70 p-6">
          <div className="mx-auto max-w-[820px]">
            <ScaledPreview resume={resume} shadow />
          </div>
        </main>
      ) : (
        <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
          {/* Editor pane */}
          <section className="space-y-4">
            <PersonalInfoEditor info={resume.personalInfo} onChange={setPersonal} />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={onSectionDragEnd}
            >
              <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {resume.sections.map((section) => (
                    <DragSection
                      key={section.id}
                      section={section}
                      api={makeApi(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={addSection}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-app-accent hover:text-app-accent"
            >
              <Icon.Plus width={16} height={16} /> Add section
            </button>

            <p className="px-1 pb-6 text-center text-xs text-slate-400">
              Edit content freely — add, rename, reorder, duplicate. The premium
              template on the right always controls the design.
            </p>
          </section>

          {/* Live preview pane */}
          <aside className="hidden lg:block">
            <div className="sticky top-[68px]">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Live preview · locked template
                </span>
                <span className="text-xs text-slate-400">A4</span>
              </div>
              <div className="nice-scroll max-h-[calc(100vh-110px)] overflow-auto rounded-xl bg-slate-200/60 p-4">
                <ScaledPreview resume={resume} shadow />
              </div>
            </div>
          </aside>
        </main>
      )}

      <UploadZone
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onParsed={onParsed}
      />
      </div>

      {/* Clean copy rendered OUTSIDE .app-shell so the print stylesheet can show
          ONLY this. If it lived inside .app-shell, that ancestor's
          `display:none` (print CSS) would hide it too → blank PDF. */}
      <div className="print-root" aria-hidden ref={printRef}>
        <ResumeRenderer resume={resume} id="resume-print" />
      </div>
    </>
  );
}

/** Clone a section with fresh IDs (for the Duplicate-section action). */
function cloneSection(s: Section): Section {
  return {
    id: uid("s"),
    title: s.title,
    layout: s.layout,
    entries: s.entries.map(cloneEntry),
  };
}

/**
 * Renders the locked template scaled to fit its container width. Used for the
 * on-screen preview only — print uses the unscaled #resume-print copy.
 */
const PAGE_H = (PAGE_W * 297) / 210; // one A4 page height in the same px scale

function ScaledPreview({ resume, shadow }: { resume: Resume; shadow?: boolean }) {
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
  }, [resume]);

  // A dashed guide wherever the export would start a new A4 page.
  // 2mm tolerance avoids a false guide from sub-pixel/rounding noise.
  const tol = (PAGE_W / 210) * 2;
  const breaks = Math.max(0, Math.ceil((dims.raw - tol) / PAGE_H) - 1);

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: dims.height }}>
      <div
        ref={pageRef}
        className={"absolute left-1/2 top-0 " + (shadow ? "shadow-xl" : "")}
        style={{
          width: PAGE_W,
          transform: `translateX(-50%) scale(${dims.scale})`,
          transformOrigin: "top center",
        }}
      >
        <ResumeRenderer resume={resume} />

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
