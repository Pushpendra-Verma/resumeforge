import { useCallback, useMemo, useRef, useState } from "react";
import { cloneResume, type Resume } from "./schema";

/**
 * Undo/redo history for the resume document.
 *
 * `update` mutates the document via an immer-free producer (clone + mutate).
 * A `tag` lets rapid edits of the same target (e.g. typing in one bullet)
 * coalesce into a single undo step, so undo doesn't replay character by
 * character — while structural actions (add / delete / reorder / duplicate)
 * each get their own checkpoint.
 */

const MAX_HISTORY = 120;
const COALESCE_MS = 600;

interface HistoryState {
  past: Resume[];
  present: Resume;
  future: Resume[];
}

export interface ResumeHistory {
  resume: Resume;
  canUndo: boolean;
  canRedo: boolean;
  /** Mutate the document. Optionally tag for coalescing successive edits. */
  update: (producer: (draft: Resume) => void, tag?: string) => void;
  /** Replace the entire document and clear history (e.g. after an upload). */
  reset: (next: Resume) => void;
  undo: () => void;
  redo: () => void;
}

export function useResumeHistory(initial: Resume): ResumeHistory {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });
  const lastTag = useRef<{ tag: string; time: number } | null>(null);

  const update = useCallback(
    (producer: (draft: Resume) => void, tag?: string) => {
      setState((prev) => {
        const draft = cloneResume(prev.present);
        producer(draft);

        const now = Date.now();
        const coalesce =
          !!tag &&
          lastTag.current?.tag === tag &&
          now - (lastTag.current?.time ?? 0) < COALESCE_MS;
        lastTag.current = tag ? { tag, time: now } : null;

        if (coalesce) return { ...prev, present: draft };

        const past = [...prev.past, prev.present];
        if (past.length > MAX_HISTORY) past.shift();
        return { past, present: draft, future: [] };
      });
    },
    [],
  );

  const reset = useCallback((next: Resume) => {
    lastTag.current = null;
    setState({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    lastTag.current = null;
    setState((prev) => {
      if (!prev.past.length) return prev;
      const present = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    lastTag.current = null;
    setState((prev) => {
      if (!prev.future.length) return prev;
      const [present, ...future] = prev.future;
      return { past: [...prev.past, prev.present], present, future };
    });
  }, []);

  return useMemo(
    () => ({
      resume: state.present,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      update,
      reset,
      undo,
      redo,
    }),
    [state, update, reset, undo, redo],
  );
}
