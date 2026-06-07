"use client";

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
  { key: "logoText", label: "Logo alt / institute", placeholder: "Institute name" },
  { key: "logoSrc", label: "Logo image URL", placeholder: "/iimv_logo.png" },
];

/** Edits the resume header data. Pure data — the template lays it out. */
export default function PersonalInfoEditor({
  info,
  onChange,
}: {
  info: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
}) {
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
    </div>
  );
}
