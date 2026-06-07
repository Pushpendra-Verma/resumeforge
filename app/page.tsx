"use client";

import dynamic from "next/dynamic";

// The editor is client-only: it reads localStorage and generates IDs on load,
// so rendering it on the server would risk hydration mismatches.
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <Splash />,
});

export default function Page() {
  return <Editor />;
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent text-lg font-black text-white">
        R
      </span>
      <p className="text-sm">Loading ResumeForge…</p>
    </div>
  );
}
