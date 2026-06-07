"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getDocument, type ResumeDocument } from "@/lib/documents";
import { BrandLockup, Splash } from "./brand";
import Editor from "./Editor";

/**
 * Resolves the requested document for the current user and guards access.
 * Editor itself only mounts once a valid document is loaded, so its hooks
 * (history, autosave) always have real data.
 */
export default function EditorScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // undefined = still resolving, null = not found
  const [doc, setDoc] = useState<ResumeDocument | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!id) {
      setDoc(null);
      return;
    }
    setDoc(getDocument(user.sub, id));
  }, [loading, user, id, router]);

  if (loading || (user && doc === undefined)) return <Splash label="Loading editor…" />;
  if (!user) return <Splash />;

  if (doc === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center">
        <BrandLockup href="/" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Resume not found</h1>
          <p className="mt-1 text-sm text-slate-500">
            It may have been deleted, or it belongs to another account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return <Editor key={doc!.id} initialDocument={doc!} userSub={user.sub} />;
}
