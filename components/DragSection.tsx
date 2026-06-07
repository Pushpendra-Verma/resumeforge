"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LAYOUT_LABELS,
  type Section,
  type SectionLayout,
} from "@/lib/schema";
import SectionBlock from "./SectionBlock";
import { AutoTextarea, Icon, IconButton } from "./ui";
import type { SectionApi } from "./editorTypes";

/**
 * DragSection — the draggable FRAME around a section.
 * Owns: drag handle, heading rename, layout switch, collapse, section actions.
 * Delegates the section's body (its entries) to <SectionBlock />.
 */
export default function DragSection({
  section,
  api,
}: {
  section: Section;
  api: SectionApi;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        "rounded-xl border border-slate-200 bg-white shadow-sm " +
        (isDragging ? "z-20 shadow-lg ring-2 ring-app-accent/40" : "")
      }
    >
      {/* Section header */}
      <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
          title="Drag to reorder section"
          {...attributes}
          {...listeners}
        >
          <Icon.Drag />
        </button>

        <IconButton
          title={collapsed ? "Expand" : "Collapse"}
          onClick={() => setCollapsed((c) => !c)}
        >
          <Icon.Chevron
            className={"transition " + (collapsed ? "-rotate-90" : "")}
          />
        </IconButton>

        <AutoTextarea
          value={section.title}
          onChange={api.setTitle}
          placeholder="SECTION TITLE"
          className="flex-1 text-sm font-bold uppercase tracking-wide text-slate-700"
        />

        <select
          value={section.layout}
          onChange={(e) => api.setLayout(e.target.value as SectionLayout)}
          title="Section layout (one of the locked template styles)"
          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 outline-none hover:border-slate-300 focus:ring-1 focus:ring-app-accent/40"
        >
          {(Object.keys(LAYOUT_LABELS) as SectionLayout[]).map((l) => (
            <option key={l} value={l}>
              {LAYOUT_LABELS[l]}
            </option>
          ))}
        </select>

        <IconButton title="Duplicate section" onClick={api.duplicateSection}>
          <Icon.Copy />
        </IconButton>
        <IconButton
          title="Delete section"
          className="hover:text-red-600"
          onClick={api.deleteSection}
        >
          <Icon.Trash />
        </IconButton>
      </div>

      {/* Section body */}
      {!collapsed && <SectionBlock section={section} api={api} />}
    </div>
  );
}
