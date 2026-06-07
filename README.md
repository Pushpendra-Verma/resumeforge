# GoodResume

Build professional, **ATS-friendly** resumes. Sign in with Google, manage all
your resumes from a dashboard, edit content in a Notion-style editor, and export
a pixel-perfect PDF — all in the browser.

> **One content model, many templates.** Every template renders the *same*
> `Resume` data. The editor only ever changes _content_; templates own 100% of
> the appearance (layout, colors, fonts, styling). Adding a template never
> duplicates business logic.

---

## ✨ Features

| Area | What you get |
| --- | --- |
| **Modern homepage** | Gradient hero, live template showcase, feature highlights |
| **Google sign-in only** | Client-side Google Identity Services — public Client ID, no server/secret |
| **Per-user dashboard** | Create, open, rename, duplicate and delete multiple resumes |
| **Template engine** | Pick a template when creating, **switch templates any time** — content is preserved |
| **Import** | PDF (`pdfjs-dist`) and DOCX (`mammoth`) parsed entirely in the browser |
| **Editor** | Add/delete/rename sections, subheadings, bullets; inline editing; duplicate entries & sections |
| **Drag & drop** | Reorder sections and bullets (`dnd-kit`) |
| **Three layouts** | `table` (education), `timeline` (experience), `list` (achievements/certs) |
| **History** | Undo/redo with smart coalescing + `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` |
| **Autosave** | Debounced per-document save to `localStorage`, namespaced per account |
| **Export** | One-click A4 PDF that matches the preview pixel-for-pixel, with clickable links |

The first template is **“IIM Style Professional Resume.”**

---

## 🚀 Getting started

```bash
npm install
cp .env.local.example .env.local   # then paste your Google Client ID
npm run dev                         # http://localhost:3000
```

Without `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, the app runs in a clearly-labeled local
**demo mode** so you can try everything before configuring OAuth.

Production:

```bash
npm run build
npm run start
```

Requires Node 18.18+ (developed on Node 24).

### Enabling real Google sign-in

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**.
2. Add your **Authorized JavaScript origins** (e.g. `http://localhost:3000` and your production URL).
3. Put the Client ID in `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Because the app is client-only, only the public Client ID is needed — the
returned ID token is decoded in the browser to read the user's profile. (A
server-backed deployment would additionally verify the token signature.)

---

## 🧱 Architecture

```
app/
  layout.tsx              Root layout: Inter (UI) + Poppins (IIM template) fonts, <AuthProvider>
  page.tsx                Landing/homepage with Google sign-in
  dashboard/page.tsx      Per-user resume dashboard (client-only)
  editor/[id]/page.tsx    Document editor route (client-only)
  globals.css             App chrome + SHARED resume base + per-template CSS + print isolation

lib/
  schema.ts               Content-only data model (Resume) + factories + normaliser
  documents.ts            Per-user, multi-resume store (CRUD + legacy migration)
  storage.ts              Legacy single-doc localStorage (read for one-time migration)
  useResumeHistory.ts     Undo/redo hook
  id.ts                   Stable IDs (DnD + history)
  parser.ts               PDF/DOCX → structured Resume
  sampleResume.ts         Seed content used for previews & the showcase
  auth/
    google.ts             GIS loader, config, ID-token decode
    AuthProvider.tsx      Auth context (session in localStorage)
  templates/              ⭐ The template engine
    constants.ts          DEFAULT_TEMPLATE_ID (no React imports)
    types.ts              ResumeTemplate + TemplateRendererProps contracts
    shared.tsx            Reusable rich-text / linkify helpers for all templates
    registry.ts           TEMPLATES list + getTemplate()/listTemplates()
    iim/
      IimTemplate.tsx     The "IIM Style Professional Resume" renderer
      index.ts            Its metadata + registration

components/
  Editor.tsx              Orchestrator: history, autosave, DnD, export — TEMPLATE-AGNOSTIC
  EditorScreen.tsx        Auth guard + document loader for the editor route
  Dashboard.tsx           Resume grid, create/rename/duplicate/delete
  TemplatedResume.tsx     Renders a resume with the chosen template (registry dispatch)
  ResumePreview.tsx       Scaled, reusable preview (landing, dashboard, editor, picker)
  TemplatePicker.tsx      Modal to choose a template (driven by the registry)
  TemplateSwitcher.tsx    In-editor template switch (lossless)
  GoogleSignInButton.tsx, UserMenu.tsx, brand.tsx, Toolbar.tsx, DragSection.tsx,
  SectionBlock.tsx, EditableBullet.tsx, PersonalInfoEditor.tsx, UploadZone.tsx, ui.tsx
```

### The rule that keeps it modular

The **editor never sets a font, size, margin, color or spacing.** It edits the
`Resume` object only. A template is just a `Renderer` component plus a CSS block
scoped to its own root class. Everything else — dashboard, picker, switcher,
editor, PDF export — reads from the registry, so a new template is picked up
everywhere automatically.

---

## ➕ Adding a new template

1. Create `lib/templates/<id>/<Name>Template.tsx` — a component of type
   `TemplateRendererProps` (`{ resume, id }`). Reuse `shared.tsx` for rich text.
   Put a stable root class on the `.resume-page` element, e.g.
   `<div className="resume-page tpl-modern" id={id}>`.
2. Add a CSS block in `globals.css` scoped under that class (`.tpl-modern …`).
   Use `mm` units so screen and PDF match.
3. Create `lib/templates/<id>/index.ts` exporting a `ResumeTemplate`
   (`id`, `name`, `description`, `tag`, `accent`, `rootClassName`, `Renderer`).
4. Register it in `lib/templates/registry.ts` by adding it to `TEMPLATES`.

No editor, storage, dashboard or export code needs to change.

---

## 🖨️ Exporting a PDF

Click **Download PDF**. The active template's DOM is captured with
`html-to-image` (the browser's own layout engine), sliced into A4 pages, and
written to a PDF via `jsPDF` — with clickable link annotations overlaid. Because
every template renders a `.resume-page` root, export works for any template and
matches the on-screen preview exactly.

---

## 🔒 Privacy

All sign-in, parsing and storage happen in your browser. Your resumes live in
`localStorage`, namespaced by your Google account id; nothing is uploaded.

## 🧰 Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Google Identity Services ·
dnd-kit · pdfjs-dist · mammoth · html-to-image · jsPDF · Inter + Poppins
(next/font).
