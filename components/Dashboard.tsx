"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  seedInitialDocuments,
  renameDocument,
  type ResumeDocument,
} from "@/lib/documents";
import { getTemplate } from "@/lib/templates/registry";
import { BrandLockup, Splash } from "./brand";
import UserMenu from "./UserMenu";
import TemplatePicker from "./TemplatePicker";
import ResumePreview from "./ResumePreview";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [docs, setDocs] = useState<ResumeDocument[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [renaming, setRenaming] = useState<ResumeDocument | null>(null);

  // Redirect unauthenticated visitors home once the session is known.
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setDocs(await listDocuments(user.sub));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await seedInitialDocuments(user);
      await refresh();
    })();
  }, [user, refresh]);

  const onCreate = useCallback(
    async (templateId: string) => {
      if (!user) return;
      // Start from the chosen template's own prefilled example content.
      const doc = await createDocument(user.sub, {
        title: "Untitled resume",
        templateId,
        resume: getTemplate(templateId).sample(),
      });
      router.push(`/editor/${doc.id}`);
    },
    [user, router],
  );

  if (loading || !user) return <Splash />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <BrandLockup href="/" markClassName="h-8 w-8" textClassName="text-base" />
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Your resumes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, edit and export ATS-friendly resumes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 active:scale-[.98]"
          >
            <Plus /> New resume
          </button>
        </div>

        {docs === null ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState onCreate={() => setPickerOpen(true)} />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onOpen={() => router.push(`/editor/${doc.id}`)}
                onRename={() => setRenaming(doc)}
                onDuplicate={async () => {
                  await duplicateDocument(user.sub, doc.id);
                  await refresh();
                }}
                onDelete={async () => {
                  if (window.confirm(`Delete "${doc.title}"? This can't be undone.`)) {
                    await deleteDocument(user.sub, doc.id);
                    await refresh();
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <TemplatePicker
        open={pickerOpen}
        onPick={(id) => {
          setPickerOpen(false);
          onCreate(id);
        }}
        onClose={() => setPickerOpen(false)}
      />

      {renaming && (
        <RenameModal
          initial={renaming.title}
          onCancel={() => setRenaming(null)}
          onSave={async (title) => {
            await renameDocument(user.sub, renaming.id, title);
            setRenaming(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  doc: ResumeDocument;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const template = getTemplate(doc.templateId);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        onClick={onOpen}
        className="block h-56 w-full overflow-hidden bg-slate-100 p-3 text-left"
        aria-label={`Open ${doc.title}`}
      >
        <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-slate-200">
          <ResumePreview templateId={doc.templateId} resume={doc.resume} />
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800">{doc.title}</p>
          <p className="truncate text-xs text-slate-400">
            {template.name} · {formatRelative(doc.updatedAt)}
          </p>
        </div>
        <CardMenu
          onOpen={onOpen}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function CardMenu({
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const item = (label: string, fn: () => void, danger = false) => (
    <button
      type="button"
      onClick={() => {
        setOpen(false);
        fn();
      }}
      className={
        "w-full px-3.5 py-2 text-left text-sm transition hover:bg-slate-50 " +
        (danger ? "text-rose-600" : "text-slate-700")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="relative flex-none" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="More actions"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {item("Open", onOpen)}
          {item("Rename", onRename)}
          {item("Duplicate", onDuplicate)}
          {item("Delete", onDelete, true)}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M12 11v6M9 14h6" />
        </svg>
      </div>
      <h2 className="mt-5 text-lg font-bold text-slate-800">No resumes yet</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Create your first resume in seconds. Pick a template, edit your content,
        and export a polished PDF.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 active:scale-[.98]"
      >
        <Plus /> Create your first resume
      </button>
    </div>
  );
}

function RenameModal({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(value);
        }}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900">Rename resume</h2>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="Resume name"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}
