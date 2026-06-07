"use client";

import { Icon, ToolButton } from "./ui";

export type SaveState = "idle" | "saving" | "saved";

export default function Toolbar({
  canUndo,
  canRedo,
  saveState,
  previewMode,
  downloading,
  onUndo,
  onRedo,
  onUpload,
  onAddSection,
  onTogglePreview,
  onDownload,
}: {
  canUndo: boolean;
  canRedo: boolean;
  saveState: SaveState;
  previewMode: boolean;
  downloading: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onUpload: () => void;
  onAddSection: () => void;
  onTogglePreview: () => void;
  onDownload: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 pr-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-app-accent text-sm font-black text-white">
          R
        </span>
        <span className="text-[15px] font-bold tracking-tight text-slate-800">
          ResumeForge
        </span>
        <span className="hidden text-xs text-slate-400 sm:inline">
          · content is yours, design is locked
        </span>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

      <ToolButton onClick={onUpload}>
        <Icon.Upload width={15} height={15} /> Upload
      </ToolButton>
      <ToolButton onClick={onAddSection}>
        <Icon.Section width={15} height={15} /> Add section
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

      {/* spacer */}
      <div className="ml-auto flex items-center gap-2">
        <SaveBadge state={saveState} />
        <ToolButton onClick={onTogglePreview}>
          <Icon.Eye width={15} height={15} />
          {previewMode ? "Edit" : "Preview"}
        </ToolButton>
        <ToolButton
          onClick={onDownload}
          disabled={downloading}
          className="!border-app-accent !bg-app-accent !text-white hover:!bg-blue-700"
        >
          {downloading ? (
            <Icon.Spinner width={15} height={15} />
          ) : (
            <Icon.Download width={15} height={15} />
          )}
          {downloading ? "Generating…" : "Download PDF"}
        </ToolButton>
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
    <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
      <span className={"h-2 w-2 rounded-full " + map.dot} />
      {map.text}
    </span>
  );
}
