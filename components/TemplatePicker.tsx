"use client";

import { useEffect, useMemo } from "react";
import { getSampleResume } from "@/lib/sampleResume";
import { listTemplates } from "@/lib/templates/registry";
import ResumePreview from "./ResumePreview";

/**
 * Modal that lists every registered template and lets the user pick one.
 * Driven entirely by the registry, so new templates appear here automatically.
 */
export default function TemplatePicker({
  open,
  title = "Choose a template",
  subtitle = "Every template shares the same content — pick a look to start with. You can switch any time.",
  onPick,
  onClose,
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
  onPick: (templateId: string) => void;
  onClose: () => void;
}) {
  const templates = listTemplates();
  const sample = useMemo(() => getSampleResume(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 max-w-xl text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="nice-scroll grid grid-cols-1 gap-5 overflow-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden bg-slate-100 p-3">
                <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-slate-200">
                  <ResumePreview templateId={t.id} resume={sample} />
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {t.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 border-t border-slate-100 p-4">
                <p className="font-semibold text-slate-800 group-hover:text-indigo-600">
                  {t.name}
                </p>
                <p className="text-xs leading-relaxed text-slate-500">{t.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                  Use this template →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
