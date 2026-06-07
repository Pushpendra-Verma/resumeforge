"use client";

import React, {
  type ButtonHTMLAttributes,
  type TextareaHTMLAttributes,
  useLayoutEffect,
  useRef,
} from "react";

/**
 * Shared editor UI primitives.
 *
 * IMPORTANT: nothing here styles the resume. These are *editor* controls only.
 * The resume's appearance is owned entirely by ResumeRenderer + globals.css.
 */

/** A textarea that auto-grows to fit its content — used for all inline edits. */
export function AutoTextarea({
  value,
  onChange,
  onEnter,
  onBold,
  inputRef,
  className = "",
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  /** Called on Ctrl/Cmd+B — lets the parent toggle bold on the selection. */
  onBold?: () => void;
  /** Exposes the underlying <textarea> so the parent can read the selection. */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const assign = (node: HTMLTextAreaElement | null) => {
    ref.current = node;
    if (inputRef) inputRef.current = node;
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={assign}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (onEnter && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter();
        } else if (onBold && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
          e.preventDefault();
          onBold();
        }
      }}
      className={
        "block w-full resize-none bg-transparent outline-none " +
        "rounded px-1.5 py-1 leading-snug text-slate-800 " +
        "focus:bg-blue-50/70 focus:ring-1 focus:ring-app-accent/40 " +
        "placeholder:text-slate-300 transition-colors " +
        className
      }
      {...rest}
    />
  );
}

export function IconButton({
  title,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={title}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 " +
        "hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition " +
        "disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}

export function ToolButton({
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={
        "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white " +
        "px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm " +
        "hover:bg-slate-50 hover:border-slate-300 active:scale-[.98] transition " +
        "disabled:opacity-40 disabled:cursor-not-allowed " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---- Tiny inline icons (stroke = currentColor) --------------------------- */
type IconProps = React.SVGProps<SVGSVGElement>;
const base = (p: IconProps) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const Icon = {
  Drag: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
    </svg>
  ),
  Copy: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  ),
  Bold: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
    </svg>
  ),
  Undo: (p: IconProps) => (
    <svg {...base(p)}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-1" /></svg>
  ),
  Redo: (p: IconProps) => (
    <svg {...base(p)}><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h1" /></svg>
  ),
  Upload: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 9l5-5 5 5M12 4v12" />
    </svg>
  ),
  Print: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  ),
  Download: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  Spinner: (p: IconProps) => (
    <svg {...base(p)} className={"animate-spin " + (p.className ?? "")}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Section: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M3 12h12M3 17h8" /></svg>
  ),
  Close: (p: IconProps) => (
    <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  Chevron: (p: IconProps) => (
    <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
  ),
};
