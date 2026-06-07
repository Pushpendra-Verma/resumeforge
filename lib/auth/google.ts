/**
 * Client-side Google Identity Services (GIS) integration.
 *
 * GoodResume is a fully client-side app — your resumes live in your browser,
 * never on a server. Google sign-in therefore uses GIS in the browser with a
 * public OAuth Client ID (no client secret, no backend). The returned ID token
 * is decoded locally to read the user's name / email / picture.
 *
 * Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable real Google sign-in. When it's
 * absent, the UI offers a clearly-labeled local demo session instead so the
 * app stays runnable during development.
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function isGoogleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.trim().length > 0;
}

export interface GoogleUser {
  sub: string; // stable Google account id — namespaces this user's documents
  name: string;
  email: string;
  picture: string;
  guest?: boolean;
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

/** Load the GIS script once; resolves when window.google.accounts.id is ready. */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Decode the JWT ID token Google returns. For a client-only app we trust the
 * token payload to populate the local profile; a server-backed app would also
 * verify the signature with Google's public keys.
 */
export function decodeCredential(credential: string): GoogleUser | null {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
    if (!json.sub) return null;
    return {
      sub: String(json.sub),
      name: String(json.name || json.email || "User"),
      email: String(json.email || ""),
      picture: String(json.picture || ""),
    };
  } catch {
    return null;
  }
}

function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const decoded = atob(b64 + pad);
  const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------------------
// Minimal typings for the slice of GIS we use.
// ---------------------------------------------------------------------------
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GsiButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonOptions) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
