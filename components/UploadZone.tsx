"use client";

import { useCallback, useRef, useState } from "react";
import { parseResumeFile } from "@/lib/parser";
import type { Resume } from "@/lib/schema";
import { Icon, ToolButton } from "./ui";

/**
 * Upload modal: drag/drop or pick a PDF / DOCX, parse it in the browser,
 * and hand the structured Resume back to the editor.
 */
export default function UploadZone({
  open,
  onClose,
  onParsed,
}: {
  open: boolean;
  onClose: () => void;
  onParsed: (resume: Resume, fileName: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setBusy(true);
      try {
        const { resume } = await parseResumeFile(file);
        onParsed(resume, file.name);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read that file.");
      } finally {
        setBusy(false);
      }
    },
    [onParsed, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Upload a resume</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon.Close />
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition " +
            (dragging
              ? "border-app-accent bg-blue-50"
              : "border-slate-300 bg-slate-50")
          }
        >
          {busy ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm text-slate-600">Reading & structuring…</p>
            </>
          ) : (
            <>
              <Icon.Upload width={28} height={28} className="text-slate-400" />
              <p className="mt-3 text-sm text-slate-600">
                Drag & drop your resume here
              </p>
              <p className="text-xs text-slate-400">PDF or DOCX</p>
              <ToolButton
                className="mt-4"
                onClick={() => inputRef.current?.click()}
              >
                Choose file
              </ToolButton>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Parsing happens entirely in your browser — nothing is uploaded to a
          server. Extracted content becomes a draft you can refine; the design
          is always applied by the fixed template.
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-7 w-7 animate-spin text-app-accent" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
