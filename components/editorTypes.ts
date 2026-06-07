import type { SectionLayout } from "@/lib/schema";

/** The text fields of an Entry that the editor exposes as inputs. */
export type EntryTextField = "title" | "organization" | "dateRange" | "location";

/**
 * The set of callbacks a section's editor UI needs. The Editor builds one of
 * these (bound to a section id) and hands it to <DragSection /> / <SectionBlock />.
 * Components below never reach into the document directly — they only call these,
 * which keeps every mutation flowing through the undo/redo history.
 */
export interface SectionApi {
  setTitle: (value: string) => void;
  setLayout: (layout: SectionLayout) => void;
  deleteSection: () => void;
  duplicateSection: () => void;

  addEntry: () => void;
  deleteEntry: (entryId: string) => void;
  duplicateEntry: (entryId: string) => void;
  setEntryField: (entryId: string, field: EntryTextField, value: string) => void;

  addBullet: (entryId: string) => void;
  deleteBullet: (entryId: string, bulletId: string) => void;
  setBullet: (entryId: string, bulletId: string, value: string) => void;
  moveBullet: (entryId: string, activeId: string, overId: string) => void;
}
