# ResumeForge

Upload **any** resume (PDF / DOCX), edit every part freely in a Notion-style
editor, and export into **one fixed premium template** — the IIM-style layout
from the sample resume.

> **Content is dynamic. Design is fixed.** The editor only ever changes _data_.
> All appearance lives in a single locked renderer, so editing content can never
> break the formatting.

---

## ✨ Features

| Area | What you get |
| --- | --- |
| **Import** | PDF (via `pdfjs-dist`) and DOCX (via `mammoth`) parsed entirely in the browser |
| **Structuring** | Raw text is auto-organised into a typed JSON schema (best-effort draft you refine) |
| **Editor** | Add / delete / rename sections, unlimited subheadings, add/remove bullets, inline editing, duplicate entries & sections, fully custom sections |
| **Drag & drop** | Reorder sections and reorder bullets (`dnd-kit`) |
| **Three locked layouts** | `table` (education), `timeline` (experience), `list` (achievements/certs/etc.) — you pick which one a section uses, never how it looks |
| **History** | Undo / redo with smart coalescing (typing in one field = one undo step) + `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` |
| **Autosave** | Debounced save to `localStorage` — your work persists across reloads |
| **Live preview** | Right-hand A4 preview, scaled to fit, rendered by the same locked template |
| **Export** | Pixel-perfect **Print / Save as PDF** + full-screen **Preview / Print mode** |

The app opens pre-loaded with the sample resume content so you can see the
template immediately, then edit or replace it via **Upload**.

---

## 🧱 Architecture

```
app/
  layout.tsx          Root layout + Lato font (the template typeface)
  page.tsx            Loads the editor client-side (ssr:false)
  globals.css         App chrome + THE LOCKED TEMPLATE CSS + print isolation

components/
  ResumeRenderer.tsx  ⭐ The locked template. Data in → fixed design out. Used for
                         both live preview AND print/PDF, so WYSIWYG is guaranteed.
  Editor.tsx          Orchestrator: store, autosave, undo/redo, DnD, export
  DragSection.tsx     Sortable section frame: drag handle, rename, layout switch
  SectionBlock.tsx    A section's editable entries + bullets
  EditableBullet.tsx  Draggable, inline-editable bullet
  PersonalInfoEditor.tsx, Toolbar.tsx, UploadZone.tsx, ui.tsx, editorTypes.ts

lib/
  schema.ts           The content-only data model + factories + normaliser
  parser.ts           PDF/DOCX → text → structured Resume
  sampleResume.ts     Seed content (the uploaded resume)
  storage.ts          localStorage autosave
  useResumeHistory.ts Undo/redo hook
  id.ts               Stable IDs (for DnD + history)
```

### The one rule that makes it work

The **editor never sets a font, size, margin, color or spacing.** It edits the
`Resume` object only. `ResumeRenderer` + `.resume-page` in `globals.css` own
100% of the appearance. Swap `ResumeRenderer` / its CSS to change the template
globally — every resume re-flows into the new design with zero content changes.

---

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

Requires Node 18.18+ (developed on Node 24).

---

## 🖨️ Exporting a PDF

Click **Print / Save PDF** (or open **Preview** then print). In the browser
print dialog choose **"Save as PDF"**, set **Margins: None** and
**Background graphics: On** for an exact match.

Export uses the browser's print engine against the *same* locked renderer, so
the PDF is identical to what you see — the most faithful way to keep the
"design is fixed" guarantee. (`@page { size: A4; margin: 0 }` and the
`.print-root` isolation rules in `globals.css` handle the rest.)

---

## 🔧 Notes & extension points

- **Parsing is best-effort.** Resumes vary wildly; the parser produces a
  structured _draft_ you then refine. Whatever it extracts is always valid
  schema, so it always renders cleanly in the template.
- **OCR (scanned PDFs).** `pdfjs-dist` reads a PDF's text layer. Image-only
  PDFs have none — `parser.ts` detects this and shows a friendly message. An
  OCR fallback (e.g. `tesseract.js` over the rendered page canvas) can be added
  at the marked extension point in `extractPdfText`.
- **PDF worker.** Loaded from a CDN pinned to the installed `pdfjs-dist`
  version (no manual worker copy needed). To go fully offline, copy
  `pdf.worker.min.mjs` into `/public` and point `GlobalWorkerOptions.workerSrc`
  at it.
- **Privacy.** All parsing and storage happen in your browser. Nothing is
  uploaded to a server.

## 🧰 Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · dnd-kit · pdfjs-dist ·
mammoth · Lato (next/font).
