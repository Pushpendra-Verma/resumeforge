"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  GOOGLE_CLIENT_ID,
  isGoogleConfigured,
  loadGoogleScript,
} from "@/lib/auth/google";

/**
 * The sign-in control.
 *
 * - When NEXT_PUBLIC_GOOGLE_CLIENT_ID is set, renders the official Google
 *   Identity Services button and signs the user in from the returned ID token.
 * - When it isn't, shows a Google-styled button that starts a clearly-labeled
 *   local demo session, so the app is fully usable before OAuth is configured.
 */
export default function GoogleSignInButton({
  onSignedIn,
}: {
  onSignedIn?: () => void;
}) {
  const { signInWithCredential, signInAsGuest } = useAuth();
  const slotRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isGoogleConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !slotRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => {
            signInWithCredential(credential)
              .then((u) => {
                if (u) onSignedIn?.();
                else
                  setError(
                    "We couldn't read your Google profile. Please try again.",
                  );
              })
              .catch(() =>
                setError("Sign-in failed. Please try again."),
              );
          },
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(slotRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320,
        });
      })
      .catch(() => setError("Couldn't load Google sign-in. Check your connection."));

    return () => {
      cancelled = true;
    };
  }, [configured, signInWithCredential, onSignedIn]);

  if (!configured) {
    return (
      <div className="flex flex-col items-stretch gap-2.5">
        <button
          type="button"
          onClick={() => {
            signInAsGuest();
            onSignedIn?.();
          }}
          className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[.99]"
        >
          <GoogleGlyph />
          Sign in with Google
        </button>
        <p className="text-center text-xs text-slate-400">
          Demo mode — set{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-500">
            NEXT_PUBLIC_GOOGLE_CLIENT_ID
          </code>{" "}
          to enable real Google sign-in.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={slotRef} className="flex min-h-[44px] justify-center" />
      {error && <p className="text-center text-xs text-rose-500">{error}</p>}
    </div>
  );
}

/** The multicolor Google "G". */
function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
