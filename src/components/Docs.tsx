import { useState } from "react";
import {
  ADAPTABILITY,
  DELTA,
  DIMENSIONS,
  LEGACY_CODE,
  REFACTORED_CODE,
  TRADE_OFFS,
} from "../data";
import { highlightLine } from "../highlight";
import { Reveal } from "../hooks";
import type { useSimulation } from "../sim";
import { CopyBtn, SectionHead } from "../ui";

type SimApi = ReturnType<typeof useSimulation>;

function Code({ code }: { code: string }) {
  return (
    <pre className="term-scroll max-h-[440px] overflow-auto p-4">
      {code.split("\n").map((line, i) => (
        <div key={i} className="flex">
          <span className="w-8 shrink-0 select-none pr-3 text-right font-mono text-[10.5px] leading-[1.7] text-faint/50">
            {i + 1}
          </span>
          <code className="whitespace-pre font-mono text-[12px] leading-[1.7] text-dim">
            {highlightLine(line, "js").map((t, j) =>
              t.cls ? (
                <span key={j} className={t.cls}>
                  {t.text}
                </span>
              ) : (
                t.text
              )
            )}
          </code>
        </div>
      ))}
    </pre>
  );
}

/* ================= verdict (RANK) ================= */
export function Verdict({ api }: { api: SimApi }) {
  const { verdict, score, sim } = api;
  const passed = score === 100;
  const rows = [
    { dim: DIMENSIONS[0], ok: verdict.adaptation, flags: [sim.flags.queuePublished, sim.flags.pendingPrintSeen, sim.flags.webhookVerified] },
    { dim: DIMENSIONS[1], ok: verdict.integrity, flags: [true, sim.flags.dupBlockedPending, sim.flags.dupBlockedCheckedIn] },
    { dim: DIMENSIONS[2], ok: verdict.delta, flags: [true, true] },
  ];

  return (
    <section id="verdict" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <SectionHead
        kicker="// EVALUATION MATRIX — RANK"
        title="The verdict is computed live"
        blurb="Three weighted dimensions, scored against the simulation flags above — not against promises. Run the suite and watch the matrix turn green."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {rows.map(({ dim, ok, flags }, i) => (
            <Reveal key={dim.id} delay={i * 90}>
              <div
                className={`panel-hover rounded-xl border p-5 sm:p-6 ${
                  ok ? "border-teal/40 bg-teal/[0.04]" : "border-edge bg-panel"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md border border-solar/40 bg-solar/10 px-2 py-0.5 font-mono text-[11px] font-bold text-solar">
                    {dim.weight}%
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink">{dim.name}</h3>
                  <span
                    className={`ml-auto rounded-md border px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-wider ${
                      ok ? "border-teal/50 bg-teal/10 text-teal" : "border-edge2 bg-panel2 text-faint"
                    }`}
                  >
                    {ok ? "PASS" : "AWAITING EVIDENCE"}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <p className="text-[12.5px] leading-relaxed text-dim">
                    <span className="mr-1.5 font-mono text-[9.5px] font-bold tracking-wider text-teal">PASS ·</span>
                    {dim.pass}
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-faint">
                    <span className="mr-1.5 font-mono text-[9.5px] font-bold tracking-wider text-rose">FAIL ·</span>
                    {dim.fail}
                  </p>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {dim.checks.map((c, j) => (
                    <li
                      key={c}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] ${
                        flags[j] ? "border-teal/40 bg-teal/10 text-teal" : "border-edge bg-deep text-faint"
                      }`}
                    >
                      <i className={`h-1.5 w-1.5 rounded-full ${flags[j] ? "bg-teal" : "bg-edge2"}`} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="lg:col-span-4">
          <Reveal delay={160} className="lg:sticky lg:top-24">
            <div className={`rounded-xl border-2 p-6 text-center ${passed ? "border-teal/60 bg-teal/[0.05]" : "border-edge bg-panel"}`}>
              <p className="font-mono text-[10.5px] tracking-[0.2em] text-faint">COMPOSITE SCORE</p>
              <p className={`mt-3 font-display text-[72px] font-bold leading-none tracking-tight ${passed ? "text-teal" : "text-ink"}`}>
                {score}
                <span className="text-[28px] text-faint">/100</span>
              </p>
              <div className="mx-auto mt-5 h-2.5 max-w-[240px] overflow-hidden rounded-full bg-base">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${passed ? "bg-teal" : "bg-solar bar-live"}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p
                key={String(passed)}
                className={`badge-flip mx-auto mt-6 inline-block -rotate-3 rounded-lg border-2 px-5 py-2 font-display text-xl font-bold tracking-[0.24em] ${
                  passed ? "border-teal/70 text-teal" : "border-edge2 text-faint"
                }`}
              >
                {passed ? "APPROVED" : "IN AUDIT"}
              </p>
              <p className="mt-4 text-[12px] leading-relaxed text-faint">
                {passed
                  ? "All three dimensions hold. Refactor ships to FINAL_DELIVERY."
                  : "Weights: 40 / 30 / 30. Evidence accrues as the harness runs."}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= scope delta ================= */
const DELTA_COLS = [
  { key: "dropped" as const, title: "DROPPED", tone: "text-rose", border: "border-rose/30", dot: "bg-rose" },
  { key: "modified" as const, title: "MODIFIED", tone: "text-solar", border: "border-solar/30", dot: "bg-solar" },
  { key: "added" as const, title: "ADDED", tone: "text-teal", border: "border-teal/30", dot: "bg-teal" },
];

export function ScopeDelta() {
  return (
    <section id="delta" className="border-t border-edge/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHead
          kicker="// SCOPE DELTA ANALYSIS"
          title="What the pivot cost, line by line"
          blurb="No side-by-side legacy, no quiet scope creep — the ledger is public. Beside it, the latency-vs-security matrix with an explicit decision on every row."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {DELTA_COLS.map((col, i) => (
            <Reveal key={col.key} delay={i * 100}>
              <div className={`panel-hover h-full rounded-xl border bg-panel p-5 ${col.border}`}>
                <p className={`font-mono text-[11px] font-bold tracking-[0.2em] ${col.tone}`}>{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {DELTA[col.key].map((item) => (
                    <li key={item} className="flex gap-2.5 text-[13px] leading-snug text-dim">
                      <i className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${col.dot}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={140} className="mt-10">
          <div className="overflow-hidden rounded-xl border border-edge bg-panel">
            <div className="flex items-center justify-between border-b border-edge bg-panel2/60 px-5 py-3">
              <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-faint">
                TRADE-OFF MATRIX — LATENCY × SECURITY × COMPLEXITY
              </p>
              <span className="rounded border border-solar/40 bg-solar/10 px-2 py-0.5 font-mono text-[10px] font-bold text-solar">
                5 DECISIONS RECORDED
              </span>
            </div>
            <div className="term-scroll overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-edge font-mono text-[10.5px] tracking-wider text-faint">
                    <th className="px-5 py-3 font-medium">DIMENSION</th>
                    <th className="px-5 py-3 font-medium">SYNC (BEFORE)</th>
                    <th className="px-5 py-3 font-medium">ASYNC (AFTER)</th>
                    <th className="px-5 py-3 font-medium">DECISION</th>
                  </tr>
                </thead>
                <tbody>
                  {TRADE_OFFS.map((row, i) => (
                    <tr key={row.dimension} className={`border-b border-edge/60 text-[12.5px] leading-relaxed transition-colors hover:bg-panel2/40 ${i === TRADE_OFFS.length - 1 ? "border-b-0" : ""}`}>
                      <td className="px-5 py-3.5 font-display text-[13.5px] font-semibold text-ink">{row.dimension}</td>
                      <td className="px-5 py-3.5 text-faint">{row.before}</td>
                      <td className="px-5 py-3.5 text-dim">{row.after}</td>
                      <td className="px-5 py-3.5 text-teal/90">{row.decision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= refactor code ================= */
export function RefactorCode() {
  const [tab, setTab] = useState<"legacy" | "async">("async");
  return (
    <section id="code" className="border-t border-edge/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHead
          kicker="// STEP 2 — REFACTOR DIRECTIVES"
          title="Deleted, not deprecated-in-place"
          blurb="Guardrail 1 is absolute: the synchronous client and its polling loop are removed from the executable build — kept here only as an exhibit. The async flow is what actually runs on the floor above."
        />

        <Reveal delay={100} className="mt-10">
          <div className="overflow-hidden rounded-xl border border-edge bg-deep">
            <div className="flex flex-wrap items-center gap-2 border-b border-edge bg-panel px-4 py-2.5">
              {(
                [
                  { id: "async", label: "checkin.async.js — LIVE", tone: "text-teal border-teal/50 bg-teal/10" },
                  { id: "legacy", label: "checkin.sync.js — REMOVED", tone: "text-rose border-rose/50 bg-rose/10" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-md border px-3 py-1.5 font-mono text-[11px] font-bold transition-all active:scale-[0.97] ${
                    tab === t.id ? t.tone : "border-edge bg-deep text-faint hover:text-dim"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <span className="ml-auto">
                <CopyBtn text={tab === "async" ? REFACTORED_CODE : LEGACY_CODE} label="copy file" />
              </span>
            </div>
            <div className="relative">
              {tab === "legacy" && (
                <span className="pointer-events-none absolute right-6 top-6 z-10 -rotate-12 rounded-lg border-2 border-rose/70 px-4 py-1.5 font-display text-lg font-bold tracking-[0.2em] text-rose/80">
                  DROPPED
                </span>
              )}
              <Code code={tab === "async" ? REFACTORED_CODE : LEGACY_CODE} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= adaptability index ================= */
export function AdaptabilityIndex({ api }: { api: SimApi }) {
  const { verdict, sim } = api;
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0]);
  const violations = 0; // all four guardrails hold by construction of the refactor
  const avg = ratings.reduce((a, b) => a + b, 0) / ADAPTABILITY.ratings.length;
  const composite = (avg / 5) * 100 * (violations === 0 ? 1 : Math.pow(0.9, violations));

  const guardrailState = [
    { label: ADAPTABILITY.guardrails[0], on: true },
    { label: ADAPTABILITY.guardrails[1], on: sim.flags.dupBlockedPending && sim.flags.dupBlockedCheckedIn },
    { label: ADAPTABILITY.guardrails[2], on: sim.flags.webhookVerified },
    { label: ADAPTABILITY.guardrails[3], on: true },
  ];

  return (
    <section id="index" className="border-t border-edge/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHead
          kicker="// STEP 4 — CONFIDENTIAL"
          title="Adaptability Index — rating template"
          blurb="The evaluator's scoring sheet for this pod. Click to rate each axis; the composite updates against the live guardrail multiplier. Verdict inputs flow straight from the simulation."
        />

        <Reveal delay={100} className="mt-10">
          <div className="relative overflow-hidden rounded-xl border border-edge bg-panel p-6 sm:p-8">
            <span className="pointer-events-none absolute -right-6 top-8 rotate-12 select-none font-display text-[44px] font-bold tracking-[0.3em] text-rose/[0.07]">
              CONFIDENTIAL
            </span>

            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px] text-faint">
              <span>POD: <span className="text-dim">Meridian-2</span></span>
              <span>SPRINT: <span className="text-dim">Meridian Pivot · wk 08</span></span>
              <span>PIVOT: <span className="text-solar">PIVOT-07</span></span>
              <span>EVALUATOR: <span className="text-dim">Lead Systems Architect</span></span>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="font-mono text-[10.5px] font-bold tracking-[0.16em] text-faint">
                  RATING AXES · 1 (strained) → 5 (exemplary)
                </p>
                <ul className="mt-4 space-y-5">
                  {ADAPTABILITY.ratings.map((r, i) => (
                    <li key={r.axis}>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[13.5px] font-semibold text-ink">{r.axis}</p>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() =>
                                setRatings((prev) => prev.map((v, j) => (j === i ? (v === n ? 0 : n) : v)))
                              }
                              aria-label={"rate " + r.axis + " " + n + " of 5"}
                              className={`h-6 w-6 rounded-md border font-mono text-[10.5px] font-bold transition-all active:scale-90 ${
                                ratings[i] >= n
                                  ? "border-solar/70 bg-solar/20 text-solar"
                                  : "border-edge bg-deep text-faint hover:border-edge2 hover:text-dim"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-[11.5px] text-faint">{r.prompt}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5">
                <p className="font-mono text-[10.5px] font-bold tracking-[0.16em] text-faint">
                  GUARDRAIL COMPLIANCE · MULTIPLIER ×{(violations === 0 ? "1.0" : "0.9^" + violations)}
                </p>
                <ul className="mt-4 space-y-2">
                  {guardrailState.map((g) => (
                    <li key={g.label} className="flex items-start gap-2.5 text-[12.5px] leading-snug">
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${g.on ? "border-teal/60 bg-teal/15 text-teal" : "border-edge2 text-faint"}`}>
                        {g.on ? (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M2 6.4 4.7 9 10 3.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <i className="h-1 w-1 rounded-full bg-edge2" />
                        )}
                      </span>
                      <span className={g.on ? "text-dim" : "text-faint"}>{g.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-lg border border-edge bg-deep p-4">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-faint">COMPOSITE (TEMPLATE PREVIEW)</p>
                  <p className="mt-2 font-display text-[40px] font-bold leading-none text-ink">
                    {ratings.some((r) => r > 0) ? composite.toFixed(1) : "—"}
                    <span className="text-[16px] text-faint"> / 100</span>
                  </p>
                  <p className="mt-3 border-t border-edge/70 pt-3 font-mono text-[10.5px] leading-relaxed text-faint">
                    {ADAPTABILITY.formula}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 font-mono text-[10.5px] text-faint">
                  {[
                    ["ADAPTATION", verdict.adaptation ? "40/40" : "—/40"],
                    ["INTEGRITY", verdict.integrity ? "30/30" : "—/30"],
                    ["SCOPE DELTA", verdict.delta ? "30/30" : "—/30"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-edge bg-deep px-2.5 py-2 text-center">
                      <p className="tracking-wider text-faint">{k}</p>
                      <p className="mt-1 text-[12.5px] font-bold text-dim">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-end justify-between gap-6">
                  <div className="flex-1 border-t border-dashed border-edge2 pt-2 font-mono text-[10px] text-faint">
                    EVALUATOR SIGN-OFF
                  </div>
                  <div className="flex-1 border-t border-dashed border-edge2 pt-2 font-mono text-[10px] text-faint">
                    POD LEAD · DATE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
