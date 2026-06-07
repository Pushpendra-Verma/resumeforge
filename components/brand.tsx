import Link from "next/link";

/** The GoodResume logo mark — a gradient tile with a document glyph. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30 " +
        className
      }
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2" aria-hidden="true">
        <path
          d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 11h6M9 14.5h6M9 8h2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Full lockup: mark + wordmark, links home by default. */
export function BrandLockup({
  href = "/",
  markClassName,
  textClassName = "text-[17px]",
}: {
  href?: string | null;
  markClassName?: string;
  textClassName?: string;
}) {
  const inner = (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark className={markClassName ?? "h-9 w-9"} />
      <span className={"font-bold tracking-tight text-slate-900 " + textClassName}>
        Good<span className="text-indigo-600">Resume</span>
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="transition-opacity hover:opacity-90">
      {inner}
    </Link>
  );
}

/** Centered, full-screen loading state shared by guarded pages. */
export function Splash({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-500">
      <BrandMark className="h-12 w-12 animate-pulse" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
