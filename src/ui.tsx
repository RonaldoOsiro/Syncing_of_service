import type { ReactNode } from "react";
import { Reveal, useCopy } from "./hooks";

export function SectionHead({
  kicker,
  title,
  blurb,
  dark = false,
}: {
  kicker: string;
  title: string;
  blurb: ReactNode;
  dark?: boolean;
}) {
  return (
    <Reveal className="max-w-3xl">
      <p className="font-mono text-xs font-medium tracking-[0.18em] text-solar">
        {kicker}
      </p>
      <h2
        className={`mt-3 font-display text-3xl font-bold leading-[1.06] tracking-tight sm:text-[40px] ${
          dark ? "text-ink" : "text-ink"
        }`}
      >
        {title}
      </h2>
      <p className={`mt-4 text-[15px] leading-relaxed ${dark ? "text-dim" : "text-dim"}`}>
        {blurb}
      </p>
    </Reveal>
  );
}

export function CopyBtn({
  text,
  label = "copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-all duration-200 active:scale-[0.96] ${
        copied
          ? "border-teal/60 bg-teal/10 text-teal"
          : "border-edge bg-panel text-faint hover:border-edge2 hover:text-dim"
      } ${className}`}
    >
      {copied ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2 6.4 4.7 9 10 3.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M8.5 3.5v-.6A1.4 1.4 0 0 0 7.1 1.5H2.9a1.4 1.4 0 0 0-1.4 1.4v4.2a1.4 1.4 0 0 0 1.4 1.4h.6"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      )}
      {copied ? "copied" : label}
    </button>
  );
}

export function HttpChip({ code }: { code: number }) {
  const tone =
    code < 300
      ? "border-teal/40 bg-teal/10 text-teal"
      : code === 403
      ? "border-rose/40 bg-rose/10 text-rose"
      : code === 409
      ? "border-solar/40 bg-solar/10 text-solar"
      : "border-edge bg-panel text-dim";
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-bold ${tone}`}>
      {code}
    </span>
  );
}

export function SolsticeMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="3.5 4.5" />
      <circle cx="16" cy="16" r="8.5" fill="#fbbf24" />
      <path d="M16 1.5v4M16 26.5v4M1.5 16h4M26.5 16h4" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
