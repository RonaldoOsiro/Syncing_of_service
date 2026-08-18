import type { ReactNode } from "react";
import { Reveal } from "./hooks";
import { useCopy } from "./hooks";

export function SectionHead({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: ReactNode;
}) {
  return (
    <Reveal className="max-w-3xl">
      <p className="font-mono text-xs font-medium tracking-[0.18em] text-amber">
        {kicker}
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold leading-[1.08] text-ink sm:text-[40px]">
        {title}
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-dim">{blurb}</p>
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

export function Chip({
  children,
  tone = "dim",
}: {
  children: ReactNode;
  tone?: "dim" | "teal" | "amber" | "sky" | "rose" | "lime";
}) {
  const tones: Record<string, string> = {
    dim: "border-edge bg-panel text-dim",
    teal: "border-teal/35 bg-teal/8 text-teal",
    amber: "border-amber/35 bg-amber/8 text-amber",
    sky: "border-sky/35 bg-sky/8 text-sky",
    rose: "border-rose/35 bg-rose/8 text-rose",
    lime: "border-lime/35 bg-lime/8 text-lime",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function TermLine({
  kind,
  text,
}: {
  kind: "cmd" | "ok" | "err" | "info" | "warn";
  text: string;
}) {
  const cls = {
    cmd: "text-ink",
    ok: "text-teal",
    err: "text-rose",
    info: "text-dim",
    warn: "text-amber",
  }[kind];
  return (
    <p className={`whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed ${cls}`}>
      {text}
    </p>
  );
}
