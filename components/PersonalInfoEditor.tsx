"use client";

import { useRef } from "react";
import type { PersonalInfo } from "@/lib/schema";
import { AutoTextarea } from "./ui";

const FIELDS: { key: keyof PersonalInfo; label: string; placeholder: string }[] = [
  { key: "name", label: "Full name", placeholder: "PUSHPENDRA VERMA" },
  { key: "headline", label: "Headline", placeholder: "M.B.A. 2027" },
  { key: "email", label: "Email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone", placeholder: "+91 ..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/…" },
  { key: "website", label: "Website", placeholder: "your-site.com" },
  { key: "location", label: "Location", placeholder: "City, Country" },
];

// Downscale an uploaded image to keep the stored data URL small and crisp at
// the size logos render (header ~17mm). Falls back to the original on failure.
const MAX_DIM = 320;
function processLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file (PNG, JPG, SVG…)."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(dataUrl); // e.g. SVG tainting — keep the original
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/** Edits the resume header data. Pure data — the template lays it out. */
export default function PersonalInfoEditor({
  info,
  onChange,
}: {
  info: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await processLogoFile(file);
      onChange("logoSrc", dataUrl);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Couldn't use that image.");
    } finally {
      if (fileRef.current) fileRef.current.value = ""; // allow re-uploading same file
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Header / Personal Info
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {f.label}
            </span>
            <AutoTextarea
              value={info[f.key]}
              onChange={(v) => onChange(f.key, v)}
              placeholder={f.placeholder}
              className="border border-slate-200 bg-white text-[13px]"
            />
          </label>
        ))}
      </div>

      {/* College / institute logo — fully optional */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            College / institute logo
          </span>
          <span className="text-[11px] text-slate-400">Optional</span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          {info.logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.logoSrc}
              alt="Logo preview"
              className="h-12 w-12 flex-none rounded bg-white object-contain p-1 ring-1 ring-slate-200"
            />
          ) : (
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded text-[10px] text-slate-300 ring-1 ring-dashed ring-slate-300">
              None
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              {info.logoSrc ? "Replace logo" : "Upload logo"}
            </button>
            {info.logoSrc && (
              <button
                type="button"
                onClick={() => onChange("logoSrc", "")}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Institute name (optional)
            </span>
            <AutoTextarea
              value={info.logoText}
              onChange={(v) => onChange("logoText", v)}
              placeholder="Indian Institute of Management…"
              className="border border-slate-200 bg-white text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              or image URL
            </span>
            <AutoTextarea
              value={info.logoSrc.startsWith("data:") ? "" : info.logoSrc}
              onChange={(v) => onChange("logoSrc", v)}
              placeholder="/iimv_logo.png"
              className="border border-slate-200 bg-white text-[13px]"
            />
          </label>
        </div>

        <p className="mt-2 px-0.5 text-[11px] leading-relaxed text-slate-400">
          Upload a logo to show it in the header. With no logo, the institute
          name (if any) shows as plain text. Leave both empty for no logo.
        </p>
      </div>
    </div>
  );
}
