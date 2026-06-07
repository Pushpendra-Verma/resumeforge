"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  FIELD_LABELS,
  fieldsForLayout,
  type Entry,
  type Section,
} from "@/lib/schema";
import EditableBullet from "./EditableBullet";
import { AutoTextarea, Icon, IconButton, ToolButton } from "./ui";
import type { SectionApi } from "./editorTypes";

/**
 * SectionBlock — the editable CONTENT of a section (its entries).
 * It edits data via `api` callbacks only; it never touches presentation.
 * The section frame, heading and drag handle live in <DragSection />.
 */
export default function SectionBlock({
  section,
  api,
}: {
  section: Section;
  api: SectionApi;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const fields = fieldsForLayout(section.layout);
  const showBullets = section.layout !== "table";
  const labels = FIELD_LABELS[section.layout];

  const addEntryLabel =
    section.layout === "table"
      ? "Add row"
      : section.layout === "list"
        ? "Add subheading group"
        : section.layout === "grouped"
          ? "Add group"
          : "Add entry";

  return (
    <div className="space-y-3 px-3 pb-3 pt-1">
      {section.entries.map((entry) => (
        <div
          key={entry.id}
          className="group/entry rounded-lg border border-slate-200/80 bg-slate-50/40 p-2.5"
        >
          {/* Entry header fields */}
          <div className="flex items-start justify-between gap-2">
            <div
              className={
                "grid flex-1 gap-x-3 gap-y-1 " +
                (fields.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")
              }
            >
              {fields.map((field) => (
                <Field
                  key={field}
                  label={labels[field]}
                  value={entry[field] as string}
                  onChange={(v) => api.setEntryField(entry.id, field, v)}
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center opacity-0 transition group-hover/entry:opacity-100">
              <IconButton
                title="Duplicate"
                onClick={() => api.duplicateEntry(entry.id)}
              >
                <Icon.Copy width={15} height={15} />
              </IconButton>
              <IconButton
                title="Delete"
                className="hover:text-red-600"
                onClick={() => api.deleteEntry(entry.id)}
              >
                <Icon.Trash width={15} height={15} />
              </IconButton>
            </div>
          </div>

          {/* Bullets */}
          {showBullets && (
            <div className="mt-2">
              <BulletEditor
                entry={entry}
                sensors={sensors}
                onMove={(a, b) => api.moveBullet(entry.id, a, b)}
                onChange={(bid, v) => api.setBullet(entry.id, bid, v)}
                onDelete={(bid) => api.deleteBullet(entry.id, bid)}
                onAdd={() => api.addBullet(entry.id)}
              />
            </div>
          )}
        </div>
      ))}

      <ToolButton onClick={api.addEntry} className="text-app-accent">
        <Icon.Plus width={15} height={15} />
        {addEntryLabel}
      </ToolButton>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <AutoTextarea
        value={value}
        onChange={onChange}
        className="border border-slate-200 bg-white text-[13px]"
      />
    </label>
  );
}

function BulletEditor({
  entry,
  sensors,
  onMove,
  onChange,
  onDelete,
  onAdd,
}: {
  entry: Entry;
  sensors: ReturnType<typeof useSensors>;
  onMove: (activeId: string, overId: string) => void;
  onChange: (bid: string, v: string) => void;
  onDelete: (bid: string) => void;
  onAdd: () => void;
}) {
  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onMove(String(active.id), String(over.id));
    }
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleEnd}
      >
        <SortableContext
          items={entry.bullets.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {entry.bullets.map((b) => (
              <EditableBullet
                key={b.id}
                bullet={b}
                onChange={(v) => onChange(b.id, v)}
                onDelete={() => onDelete(b.id)}
                onEnter={onAdd}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-app-accent"
      >
        <Icon.Plus width={13} height={13} /> Add bullet
      </button>
    </div>
  );
}
