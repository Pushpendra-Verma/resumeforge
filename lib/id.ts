/**
 * Small stable ID generator used for sections, entries and bullets.
 * Stable IDs are what make drag-and-drop reordering and undo/redo reliable.
 */
export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}
