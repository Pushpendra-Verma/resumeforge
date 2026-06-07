"use client";

import { useEffect, useRef, useState } from "react";
import { getTemplate, listTemplates } from "@/lib/templates/registry";

/**
 * Switch the current document's template. Because every template renders the
 * same content, switching is instant and lossless — a great demonstration of
 * the content/presentation split.
 */
export default function TemplateSwitcher({
  templateId,
  onChange,
}: {
  templateId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getTemplate(templateId);
  const templates = listTemplates();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Switch template"
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="h-3 w-3 flex-none rounded-full" style={{ background: current.accent }} />
        <span className="hidden max-w-[140px] truncate md:inline">{current.name}</span>
        <span className="md:hidden">Template</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <p className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Templates
          </p>
          {templates.map((t) => {
            const active = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition hover:bg-slate-50 " +
                  (active ? "bg-indigo-50/60" : "")
                }
              >
                <span className="mt-0.5 h-4 w-4 flex-none rounded-full ring-2 ring-white" style={{ background: t.accent }} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800">{t.name}</span>
                    {active && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
