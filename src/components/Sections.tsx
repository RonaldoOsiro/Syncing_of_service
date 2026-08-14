import { useState } from "react";
import {
  ALTERNATES,
  MODULES,
  RAIL_STATS,
  SIGNALS,
  TAGS,
  type Signal,
} from "../data";
import { Reveal } from "../hooks";
import { CopyButton } from "./Terminal";

const ACCENT: Record<string, { text: string; border: string; chip: string }> = {
  sky: {
    text: "text-sky",
    border: "hover:border-sky/50",
    chip: "border-sky/30 text-sky bg-sky/5",
  },
  teal: {
    text: "text-teal",
    border: "hover:border-teal/50",
    chip: "border-teal/30 text-teal bg-teal/5",
  },
  amber: {
    text: "text-amber",
    border: "hover:border-amber/50",
    chip: "border-amber/30 text-amber bg-amber/5",
  },
  rose: {
    text: "text-rose",
    border: "hover:border-rose/50",
    chip: "border-rose/30 text-rose bg-rose/5",
  },
};

function SectionHead({
  kicker,
  title,
  blurb,
}: {
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <Reveal className="max-w-2xl">
      <p className="font-mono text-xs tracking-widest text-amber">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-dim">{blurb}</p>
    </Reveal>
  );
}

/* ================= module ledger ================= */
export function Modules() {
  return (
    <section className="border-t border-edge/70 py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <SectionHead
              kicker="// 01 — analysis"
              title="What this hunk actually does"
              blurb="Four concerns are tangled into one tail-of-file script. The commit message above is just these four, in dependency order — render, simulate, wire, boot."
            />
            <Reveal delay={120} className="mt-8">
              <ul className="divide-y divide-edge/70 border-y border-edge/70">
                {RAIL_STATS.map((s) => (
                  <li
                    key={s.k}
                    className="flex items-baseline justify-between py-2.5"
                  >
                    <span className="text-[13px] text-dim">{s.k}</span>
                    <span className="tabular font-mono text-sm font-semibold text-ink">
                      {s.v}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-edge bg-panel px-3 py-1 font-mono text-[11px] text-dim transition-colors hover:border-amber/50 hover:text-amber"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-8">
          <ol className="space-y-4">
            {MODULES.map((m, i) => {
              const a = ACCENT[m.color];
              return (
                <Reveal as="li" key={m.n} delay={i * 90}>
                  <div
                    className={`panel-hover group rounded-xl border border-edge bg-panel p-5 sm:p-6 ${a.border}`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <span
                        className={`tabular mt-0.5 font-display text-2xl font-bold ${a.text} opacity-80`}
                      >
                        {m.n}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-white">
                          {m.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.fns.map((f) => (
                            <code
                              key={f}
                              className={`rounded border px-2 py-0.5 font-mono text-[11px] ${a.chip}`}
                            >
                              {f}
                            </code>
                          ))}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-dim">
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ================= signals ================= */
const TAG_STYLE: Record<Signal["tag"], string> = {
  hint: "border-amber/40 bg-amber/10 text-amber",
  note: "border-sky/40 bg-sky/10 text-sky",
  caution: "border-rose/40 bg-rose/10 text-rose",
};

export function Signals() {
  return (
    <section className="border-t border-edge/70 py-16 sm:py-20">
      <SectionHead
        kicker="// 02 — close reading"
        title="Signals that shaped the message"
        blurb="A commit message is an argument about intent. These are the traces in the code that decided the type, the scope, and the body — including two sharp edges worth flagging."
      />
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {SIGNALS.map((s, i) => (
          <Reveal
            as="li"
            key={s.title}
            delay={(i % 2) * 90}
            className={i === 0 ? "md:col-span-2" : ""}
          >
            <div className="panel-hover h-full rounded-xl border border-edge bg-panel2 p-5 sm:p-6">
              <span
                className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TAG_STYLE[s.tag]}`}
              >
                {s.tag}
              </span>
              <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug text-ink">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ================= alternates ================= */
export function Alternates() {
  const [active, setActive] = useState(ALTERNATES[0].id);
  const current = ALTERNATES.find((a) => a.id === active) ?? ALTERNATES[0];

  return (
    <section className="border-t border-edge/70 py-16 sm:py-20">
      <SectionHead
        kicker="// 03 — pick your flavour"
        title="Three alternates, same diff"
        blurb="House style varies. Same analysis, three registers — from a squash-friendly one-liner to stakeholder release notes."
      />

      <Reveal delay={100} className="mt-8">
        <div className="flex flex-wrap gap-2">
          {ALTERNATES.map((a) => (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              className={`rounded-md border px-4 py-2 font-display text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                active === a.id
                  ? "border-amber/70 bg-amber/10 text-amber"
                  : "border-edge bg-panel text-dim hover:border-edge2 hover:text-ink"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div
          key={current.id}
          className="reveal is-in mt-4 overflow-hidden rounded-xl border border-edge bg-deep"
        >
          <div className="flex items-center justify-between gap-3 border-b border-edge bg-panel px-4 py-2.5">
            <span className="font-mono text-[11px] text-faint">
              {current.hint}
            </span>
            <CopyButton
              text={current.lines.join("\n")}
              compact
              label="copy"
            />
          </div>
          <pre className="term-scroll overflow-x-auto whitespace-pre-wrap px-5 py-5 font-mono text-[12.5px] leading-relaxed sm:px-6">
            {current.lines.map((line, i) => (
              <span key={i} className={i === 0 ? "text-ink" : "text-dim"}>
                {line === "" ? "\u00A0" : line}
                {"\n"}
              </span>
            ))}
          </pre>
        </div>
      </Reveal>
    </section>
  );
}
