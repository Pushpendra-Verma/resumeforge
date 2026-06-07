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
  /** Sign in from a Google ID token; returns the user or null if it can't be read. */
  signInWithCredential: (credential: string) => GoogleUser | null;
  /** Local demo session used only when Google sign-in isn't configured. */
  signInAsGuest: () => GoogleUser;
  signOut: () => void;
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
    (credential: string) => {
      const u = decodeCredential(credential);
      if (u) persist(u);
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

  const signOut = useCallback(() => {
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      /* GIS may not be loaded */
    }
    persist(null);
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
