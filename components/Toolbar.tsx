"use client";

import { Icon, ToolButton } from "./ui";
import { BrandMark } from "./brand";
import UserMenu from "./UserMenu";
import TemplateSwitcher from "./TemplateSwitcher";

export type SaveState = "idle" | "saving" | "saved";

export default function Toolbar({
  title,
  templateId,
  canUndo,
  canRedo,
  saveState,
  previewMode,
  downloading,
  onTitleChange,
  onTemplateChange,
  onBack,
  onUndo,
  onRedo,
  onUpload,
  onAddSection,
  onTogglePreview,
  onDownload,
}: {
  title: string;
  templateId: string;
  canUndo: boolean;
  canRedo: boolean;
  saveState: SaveState;
  previewMode: boolean;
  downloading: boolean;
  onTitleChange: (value: string) => void;
  onTemplateChange: (id: string) => void;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpload: () => void;
  onAddSection: () => void;
  onTogglePreview: () => void;
  onDownload: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur">
      {/* Left: back + brand + editable title */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          title="Back to dashboard"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <BrandMark className="hidden h-7 w-7 sm:inline-flex" />
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled resume"
          aria-label="Resume name"
          className="min-w-0 max-w-[220px] truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-[15px] font-semibold text-slate-800 outline-none transition hover:border-slate-200 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

      <ToolButton onClick={onUpload}>
        <Icon.Upload width={15} height={15} /> Upload
      </ToolButton>
      <ToolButton onClick={onAddSection}>
        <Icon.Section width={15} height={15} />
        <span className="hidden sm:inline">Add section</span>
      </ToolButton>

      <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

      <ToolButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">
        <Icon.Undo width={15} height={15} />
        <span className="hidden md:inline">Undo</span>
      </ToolButton>
      <ToolButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">
        <Icon.Redo width={15} height={15} />
        <span className="hidden md:inline">Redo</span>
      </ToolButton>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-2">
        <SaveBadge state={saveState} />
        <TemplateSwitcher templateId={templateId} onChange={onTemplateChange} />
        <ToolButton onClick={onTogglePreview}>
          <Icon.Eye width={15} height={15} />
          <span className="hidden sm:inline">{previewMode ? "Edit" : "Preview"}</span>
        </ToolButton>
        <ToolButton
          onClick={onDownload}
          disabled={downloading}
          className="!border-indigo-600 !bg-indigo-600 !text-white hover:!bg-indigo-700"
        >
          {downloading ? (
            <Icon.Spinner width={15} height={15} />
          ) : (
            <Icon.Download width={15} height={15} />
          )}
          <span className="hidden sm:inline">{downloading ? "Generating…" : "Download PDF"}</span>
        </ToolButton>
        <div className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map = {
    idle: { dot: "bg-slate-300", text: "Autosave on" },
    saving: { dot: "bg-amber-400 animate-pulse", text: "Saving…" },
    saved: { dot: "bg-emerald-500", text: "Saved" },
  }[state];
  return (
    <span className="hidden items-center gap-1.5 text-xs text-slate-500 lg:flex">
      <span className={"h-2 w-2 rounded-full " + map.dot} />
      {map.text}
    </span>
  );
}
