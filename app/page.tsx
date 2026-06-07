"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSampleResume } from "@/lib/sampleResume";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates/registry";
import { BrandLockup, Splash } from "@/components/brand";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ResumePreview from "@/components/ResumePreview";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sample = useMemo(() => getSampleResume(), []);

  if (loading) return <Splash />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute right-[-120px] top-24 h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.08)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <BrandLockup href={null} />
        <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          Private &amp; secure
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-10">
        {/* Left */}
        <div className="gr-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm backdrop-blur">
            <Sparkle /> Create. Personalize. Stand Out.
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            Build Resumes
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              That Open Doors.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-500">
            Create professional, ATS-friendly resumes in minutes with modern
            templates that make you stand out.
          </p>

          <div className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{f.title}</p>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Auth card */}
          <div className="mt-9 max-w-md rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-xl shadow-indigo-500/5 backdrop-blur">
            {user ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-600">
                  Welcome back,{" "}
                  <span className="font-semibold text-slate-900">
                    {user.name.split(" ")[0]}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 active:scale-[.99]"
                >
                  Open your dashboard
                  <Arrow />
                </button>
              </div>
            ) : (
              <GoogleSignInButton onSignedIn={() => router.push("/dashboard")} />
            )}
            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Shield /> Secure · Private · Always yours
            </p>
          </div>
        </div>

        {/* Right — live template showcase */}
        <div className="gr-rise relative hidden lg:block" style={{ animationDelay: "120ms" }}>
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-200/40 to-violet-200/40 blur-2xl" />
          <div className="rotate-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 transition-transform duration-500 hover:rotate-0">
            <div className="mb-2 flex items-center gap-1.5 px-2 pt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="ml-2 text-[11px] font-medium text-slate-400">
                IIM Style Professional Resume
              </span>
            </div>
            <div className="max-h-[560px] overflow-hidden rounded-lg ring-1 ring-slate-100">
              <ResumePreview templateId={DEFAULT_TEMPLATE_ID} resume={sample} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const FEATURES = [
  {
    title: "ATS Friendly",
    desc: "Optimized to pass automated resume scans.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    title: "Professional Templates",
    desc: "Modern, clean and recruiter-approved designs.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    title: "Easy to Customize",
    desc: "Edit, personalize and tailor to your career.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
];

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function Shield() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}
