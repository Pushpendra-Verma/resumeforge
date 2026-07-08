"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { decodeCredential, type GoogleUser } from "./google";

/**
 * Auth context. The session (the decoded Google profile) is persisted in
 * localStorage so a refresh keeps you signed in. `loading` is true until the
 * stored session has been read on mount — pages show a splash until then to
 * avoid a flash of the signed-out UI and any hydration mismatch.
 */

const SESSION_KEY = "goodresume:session:v1";

interface AuthContextValue {
  user: GoogleUser | null;
  loading: boolean;
  /**
   * Sign in from a Google ID token. Persists the local profile AND exchanges
   * the token for a server session cookie (so the cloud API can authorize this
   * user across devices). Resolves to the user, or null if the token can't be read.
   */
  signInWithCredential: (credential: string) => Promise<GoogleUser | null>;
  /** Local demo session used only when Google sign-in isn't configured. */
  signInAsGuest: () => GoogleUser;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as GoogleUser);
    } catch {
      /* ignore corrupt session */
    }
    setLoading(false);
  }, []);

  const persist = useCallback((next: GoogleUser | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, []);

  const signInWithCredential = useCallback(
    async (credential: string) => {
      const u = decodeCredential(credential);
      if (!u) return null;
      persist(u);
      // Exchange the Google token for our own httpOnly session cookie so the
      // cloud API can authorize this user. Best-effort: if it fails (or the
      // backend isn't configured), the app still works in local-only mode.
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
      } catch {
        /* stay signed in locally */
      }
      return u;
    },
    [persist],
  );

  const signInAsGuest = useCallback(() => {
    const guest: GoogleUser = {
      sub: "local-guest",
      name: "Guest",
      email: "",
      picture: "",
      guest: true,
    };
    persist(guest);
    return guest;
  }, [persist]);

  const signOut = useCallback(async () => {
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      /* GIS may not be loaded */
    }
    persist(null);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      /* cookie will expire on its own */
    }
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signInWithCredential, signInAsGuest, signOut }),
    [user, loading, signInWithCredential, signInAsGuest, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
