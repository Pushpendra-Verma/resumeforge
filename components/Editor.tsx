"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
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
import { clampFontScale, saveDocument, type ResumeDocument } from "@/lib/documents";
import { getTemplate } from "@/lib/templates/registry";
import { useResumeHistory } from "@/lib/useResumeHistory";
import type { EntryTextField, SectionApi } from "./editorTypes";

import Toolbar, { type SaveState } from "./Toolbar";
import DragSection from "./DragSection";
import PersonalInfoEditor from "./PersonalInfoEditor";
import TemplatedResume from "./TemplatedResume";
import ResumePreview from "./ResumePreview";
import UploadZone from "./UploadZone";
import { Icon } from "./ui";

export default function Editor({
  initialDocument,
  userSub,
}: {
  initialDocument: ResumeDocument;
  userSub: string;
}) {
  const router = useRouter();

  // Content lives in the history; title + template are document-level metadata.
  const history = useResumeHistory(initialDocument.resume);
  const { resume, update, reset, undo, redo, canUndo, canRedo } = history;
  const [title, setTitle] = useState(initialDocument.title);
  const [templateId, setTemplateId] = useState(initialDocument.templateId);
  const [fontScale, setFontScale] = useState(initialDocument.fontScale ?? 1);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // -- Autosave (debounced) — persists content, title and template together ---
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      saveDocument(userSub, {
        id: initialDocument.id,
        createdAt: initialDocument.createdAt,
        updatedAt: Date.now(),
        title,
        templateId,
        fontScale,
        resume,
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("saved"));
    }, 600);
    return () => clearTimeout(t);
  }, [resume, title, templateId, fontScale, userSub, initialDocument.id, initialDocument.createdAt]);

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

  // -- Font size: scale the whole resume by ~0.2pt steps --------------------
  const baseFontPt = getTemplate(templateId).baseFontPt;
  const fontPt = baseFontPt * fontScale;
  const stepFont = useCallback(
    (deltaPt: number) => {
      const base = getTemplate(templateId).baseFontPt;
      const nextPt = Math.min(14, Math.max(6, base * fontScale + deltaPt));
      setFontScale(clampFontScale(nextPt / base));
    },
    [templateId, fontScale],
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
        setDateRange: (value) =>
          update((d) => {
            const s = findSection(d);
            if (s) s.dateRange = value;
          }, `dates:${sid}`),
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
   * dialog. The visible content is the real DOM rendered with html-to-image
   * (so tables/fonts/spacing/pagination match the preview pixel-for-pixel), and
   * on top of that image we lay down an INVISIBLE real-text layer positioned
   * from each text node's on-screen rect. That makes the PDF ATS-readable,
   * selectable, copyable, and re-parseable by this app's own uploader — without
   * changing a single visible pixel. The page is found via `.resume-page`,
   * which every template renders, so export works for any template.
   */
  const onDownload = useCallback(async () => {
    const root = printRef.current;
    const page = root?.querySelector(".resume-page") as HTMLElement | null;
    if (!root || !page) return;
    setDownloading(true);

    const savedStyle = root.getAttribute("style") ?? "";
    root.style.cssText =
      "display:block;position:absolute;left:-10000px;top:0;width:210mm;background:#fff;";

    try {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = await toCanvas(page, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
        // Match the live DOM's text shaping (inherited from <body>) so kerning —
        // and therefore line wrapping — is identical to the preview. Without
        // this the off-screen render shapes text un-kerned (slightly wider) and
        // drops the last word of a full line, leaving a trailing gap.
        style: {
          textRendering: "optimizeLegibility",
          fontKerning: "normal",
        },
      });

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWmm = pdf.internal.pageSize.getWidth();
      const pageHmm = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pageWmm;
      const pageHpx = Math.floor(pageHmm * pxPerMm);

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

      const pageRect = page.getBoundingClientRect();
      const mmPerPx = pageWmm / pageRect.width;

      // Invisible text layer: walk the page's text nodes in DOM (reading) order
      // and place each one as hidden text at its on-screen position, so the PDF
      // carries a real, extractable text layer behind the image. pdfjs (and any
      // ATS) reads invisible text exactly like a searchable scanned PDF.
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      pdf.setFont("helvetica", "normal");
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.nodeValue?.replace(/\s+/g, " ").trim();
        const el = node.parentElement;
        if (!text || !el) continue;
        range.selectNodeContents(node);
        const r = range.getClientRects()[0];
        if (!r) continue;
        const fsPx = parseFloat(getComputedStyle(el).fontSize) || 12;
        const xmm = (r.left - pageRect.left) * mmPerPx;
        const yAbs = (r.top - pageRect.top) * mmPerPx;
        const pageIndex = Math.floor(yAbs / pageHmm);
        if (pageIndex < 0 || pageIndex + 1 > pdf.getNumberOfPages()) continue;
        pdf.setPage(pageIndex + 1);
        pdf.setFontSize(fsPx * 0.75); // px -> pt
        pdf.text(text, xmm, yAbs - pageIndex * pageHmm, {
          renderingMode: "invisible",
          baseline: "top",
        });
      }

      // Overlay clickable link annotations from each <a>'s on-screen rect.
      page.querySelectorAll("a[href]").forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (!href) return;
        for (const r of Array.from(a.getClientRects())) {
          const xmm = (r.left - pageRect.left) * mmPerPx;
          const yAbs = (r.top - pageRect.top) * mmPerPx;
          const wmm = r.width * mmPerPx;
          const hmm = r.height * mmPerPx;
          const pageIndex = Math.floor((yAbs + hmm / 2) / pageHmm);
          if (pageIndex + 1 > pdf.getNumberOfPages()) continue;
          pdf.setPage(pageIndex + 1);
          pdf.link(xmm, yAbs - pageIndex * pageHmm, wmm, hmm, { url: href });
        }
      });

      const base =
        (title || resume.personalInfo.name || "resume")
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
  }, [title, resume.personalInfo.name]);

  const sectionIds = useMemo(() => resume.sections.map((s) => s.id), [resume.sections]);

  return (
    <>
      <div className="app-shell flex min-h-screen flex-col">
        <Toolbar
          title={title}
          templateId={templateId}
          canUndo={canUndo}
          canRedo={canRedo}
          saveState={saveState}
          previewMode={previewMode}
          fontPt={fontPt}
          onFontStep={stepFont}
          onTitleChange={setTitle}
          onTemplateChange={setTemplateId}
          onBack={() => router.push("/dashboard")}
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
              <ResumePreview templateId={templateId} resume={resume} fontScale={fontScale} shadow pageGuides />
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-indigo-500 hover:text-indigo-600"
              >
                <Icon.Plus width={16} height={16} /> Add section
              </button>

              <p className="px-1 pb-6 text-center text-xs text-slate-400">
                Edit content freely — add, rename, reorder, duplicate. Switch
                templates any time; your content stays the same.
              </p>
            </section>

            {/* Live preview pane */}
            <aside className="hidden lg:block">
              <div className="sticky top-[68px]">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Live preview
                  </span>
                  <span className="text-xs text-slate-400">A4</span>
                </div>
                <div className="nice-scroll max-h-[calc(100vh-110px)] overflow-auto rounded-xl bg-slate-200/60 p-4">
                  <ResumePreview templateId={templateId} resume={resume} fontScale={fontScale} shadow pageGuides />
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

      {/* Clean, unscaled copy rendered OUTSIDE .app-shell for the PDF export. */}
      <div className="print-root" aria-hidden ref={printRef}>
        <TemplatedResume
          templateId={templateId}
          resume={resume}
          fontScale={fontScale}
          id="resume-print"
        />
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
    dateRange: s.dateRange,
    entries: s.entries.map(cloneEntry),
  };
}
