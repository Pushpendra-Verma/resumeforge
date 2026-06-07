"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bullet } from "@/lib/schema";
import { AutoTextarea, Icon, IconButton } from "./ui";

/**
 * A single draggable, inline-editable bullet point.
 * - Drag is bound to the handle only, so editing text never starts a drag.
 * - Select any part of the text and press Ctrl/Cmd+B (or the "B" button) to
 *   bold just that selection. Bold is stored as lightweight **markers** in the
 *   plain-text value and rendered as <strong> by the locked template.
 */
export default function EditableBullet({
  bullet,
  onChange,
  onDelete,
  onEnter,
}: {
  bullet: Bullet;
  onChange: (value: string) => void;
  onDelete: () => void;
  onEnter: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: bullet.id });
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleBold = () => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    if (s === e) return; // nothing selected — nothing to bold
    const sel = value.slice(s, e);
    const wrapped = sel.startsWith("**") && sel.endsWith("**") && sel.length >= 4;
    const next = wrapped ? sel.slice(2, -2) : `**${sel}**`;
    const newValue = value.slice(0, s) + next + value.slice(e);
    const newEnd = wrapped ? e - 4 : e + 4;
    onChange(newValue);
    // Restore the selection after React re-renders with the new value.
    requestAnimationFrame(() => {
      const t = taRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(s, newEnd);
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        "group flex items-start gap-1 rounded-md " +
        (isDragging ? "bg-white shadow-md ring-1 ring-app-accent/30 z-10 relative" : "")
      }
    >
      <button
        type="button"
        className="mt-1.5 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        title="Drag to reorder bullet"
        {...attributes}
        {...listeners}
      >
        <Icon.Drag width={14} height={14} />
      </button>
      <span className="mt-1.5 select-none text-slate-400">•</span>
      <AutoTextarea
        inputRef={taRef}
        value={bullet.text}
        onChange={onChange}
        onEnter={onEnter}
        onBold={toggleBold}
        placeholder="Write a bullet point…"
        className="text-[13px]"
      />
      <IconButton
        title="Bold selection (Ctrl/Cmd+B)"
        className="mt-0.5 opacity-0 group-hover:opacity-100"
        // mousedown (not click) so the textarea keeps its selection
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBold();
        }}
      >
        <Icon.Bold width={14} height={14} />
      </IconButton>
      <IconButton
        title="Delete bullet"
        className="mt-0.5 opacity-0 group-hover:opacity-100 hover:text-red-600"
        onClick={onDelete}
      >
        <Icon.Trash width={14} height={14} />
      </IconButton>
    </div>
  );
}
