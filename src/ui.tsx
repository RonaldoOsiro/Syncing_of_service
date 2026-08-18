import type { ReactNode } from "react";
import { Reveal, useCopy } from "./hooks";

export function SectionHead({
  kicker,
  title,
  blurb,
  dark = false,
}: {
  kicker: string;
  title: ReactNode;
  blurb?: ReactNode;
  dark?: boolean;
}) {
  return (
    <Reveal className="max-w-3xl">
      <p
        className={`font-mono text-[11.5px] font-semibold tracking-[0.22em] uppercase ${
          dark ? "text-tealbr" : "text-teal"
        }`}
      >
        {kicker}
      </p>
      <h2
        className={`mt-4 font-display text-[32px] font-bold leading-[1.05] tracking-tight sm:text-[44px] ${
          dark ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {blurb && (
        <p className={`mt-5 text-[16px] leading-relaxed ${dark ? "text-mist" : "text-slate"}`}>
          {blurb}
        </p>
      )}
    </Reveal>
  );
}

export function CopyBtn({
  text,
  label = "Copy",
  dark = false,
}: {
  text: string;
  label?: string;
  dark?: boolean;
}) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-all duration-200 active:scale-[0.95] ${
        copied
          ? "border-tealbr/70 bg-tealbr/15 text-tealbr"
          : dark
          ? "border-ink3 bg-ink2 text-mist hover:border-teal/60 hover:text-tealbr"
          : "border-edge bg-card text-faint hover:border-teal/50 hover:text-teal"
      }`}
    >
      {copied ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6.4 4.7 9 10 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8.5 3.5v-.6A1.4 1.4 0 0 0 7.1 1.5H2.9a1.4 1.4 0 0 0-1.4 1.4v4.2a1.4 1.4 0 0 0 1.4 1.4h.6" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
      {copied ? "copied" : label}
    </button>
  );
}

export function StatusPill({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10.5px] font-semibold ${
        dark
          ? "border-green/40 bg-green/10 text-[#6ee7b7]"
          : "border-green/30 bg-greensoft text-green"
      }`}
    >
      <i className="led-green h-1.5 w-1.5 rounded-full bg-green" />
      All systems operational
    </span>
  );
}

export function NorthstarMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#0d1b2e" />
      <path d="M16 5l2.4 8.6L27 16l-8.6 2.4L16 27l-2.4-8.6L5 16l8.6-2.4z" fill="#14b8a6" />
      <circle cx="16" cy="16" r="1.6" fill="#0d1b2e" />
    </svg>
  );
}
