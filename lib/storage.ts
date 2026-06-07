import { normalizeResume, type Resume } from "./schema";

/** Local autosave. Everything stays on the user's machine — no server needed. */
const STORAGE_KEY = "resumeforge:document:v1";

export function loadResume(): Resume | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeResume(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveResume(resume: Resume): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  } catch {
    // Quota / private-mode errors are non-fatal for the editor.
  }
}

export function clearResume(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
