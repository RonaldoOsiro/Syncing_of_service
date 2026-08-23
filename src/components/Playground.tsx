import { useState } from "react";
import {
  CODE_TABS,
  SCENARIOS,
  VERIFY_STEPS,
  type ScenarioId,
} from "../data";
import { highlightLine } from "../highlight";
import { Reveal, useCopy } from "../hooks";
import { sleep } from "../lib";
import { CopyBtn, SectionHead } from "../ui";

type StepState = "idle" | "run" | "pass" | "fail";

const FAIL_AT: Record<ScenarioId, number> = {
  valid: 4,
  stale: 1,
  replay: 2,
  tamper: 3,
};

const RESPONSES: Record<
  ScenarioId,
  { status: number; cls: string; body: string; note: string }
> = {
  valid: {
    status: 200,
    cls: "text-[#6ee7b7] border-[#6ee7b7]/30 bg-[#6ee7b7]/10",
    body: '{ "ok": true, "received": "stock.updated",\n  "sku": "NS-1042", "stock": 118 }',
    note: "store updated — source: webhook:verified",
  },
  stale: {
    status: 400,
    cls: "text-[#fcd34d] border-[#fcd34d]/30 bg-[#fcd34d]/10",
    body: '{ "error": "timestamp outside window" }',
    note: "signed 6 min ago — beyond the ±5 min freshness window",
  },
  replay: {
    status: 409,
    cls: "text-[#fda4af] border-[#fda4af]/30 bg-[#fda4af]/10",
    body: '{ "error": "nonce already seen" }',
    note: "that nonce was consumed by an earlier accepted request",
  },
  tamper: {
    status: 401,
    cls: "text-[#fda4af] border-[#fda4af]/30 bg-[#fda4af]/10",
    body: '{ "error": "invalid signature" }',
    note: "body changed after signing — HMAC over raw bytes mismatched",
  },
};

function CodePanel() {
  const [tab, setTab] = useState(CODE_TABS[0].id);
  const current = CODE_TABS.find((t) => t.id === tab) ?? CODE_TABS[0];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink3 bg-ink2">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-ink3 px-3 py-2.5">
        {CODE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 font-mono text-[11.5px] transition-all ${
              tab === t.id
                ? "bg-teal/15 font-semibold text-tealbr"
                : "text-mist hover:bg-ink3 hover:text-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto hidden sm:block">
          <CopyBtn text={current.code.join("\n")} dark label="copy" />
        </span>
      </div>
      <pre key={tab} className="term-scroll pop flex-1 overflow-auto p-5">
        {current.code.map((line, i) => (
          <div key={i} className="flex min-w-max">
            <span className="w-8 shrink-0 select-none pr-4 text-right font-mono text-[11px] leading-6 text-[#3d5375]">
              {i + 1}
            </span>
            <code className="font-mono text-[12.5px] leading-6 text-[#d7e2f2]">
              {highlightLine(line, current.lang).map((tk, j) =>
                tk.cls ? (
                  <span key={j} className={tk.cls}>
                    {tk.text}
                  </span>
                ) : (
                  <span key={j}>{tk.text}</span>
                )
              )}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}

function Inspector() {
  const [scenario, setScenario] = useState<ScenarioId>("valid");
  const [steps, setSteps] = useState<StepState[]>(["idle", "idle", "idle", "idle"]);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<ScenarioId | null>(null);
  const [store, setStore] = useState([
    { sku: "NS-1042", stock: 96, source: "seed" },
    { sku: "NS-2210", stock: 57, source: "seed" },
    { sku: "NS-0387", stock: 12, source: "seed" },
  ]);
  const [flash, setFlash] = useState(0);

  const failAt = FAIL_AT[scenario];
  const ts =
    scenario === "stale"
      ? Date.now() - 6 * 60 * 1000
      : Date.now();
  const nonce =
    scenario === "replay" ? "f3d1c2a4-replay-fixed" : crypto.randomUUID().slice(0, 13);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setResponse(null);
    setSteps(["idle", "idle", "idle", "idle"]);

    for (let i = 0; i < VERIFY_STEPS.length; i++) {
      setSteps((prev) => prev.map((s, j) => (j === i ? "run" : s)));
      await sleep(430);
      const failed = i === failAt;
      setSteps((prev) => prev.map((s, j) => (j === i ? (failed ? "fail" : "pass") : s)));
      if (failed) {
        setResponse(scenario);
        setRunning(false);
        return;
      }
    }
    setResponse("valid");
    setStore((prev) =>
      prev.map((r) =>
        r.sku === "NS-1042" ? { sku: r.sku, stock: 118, source: "webhook:verified" } : r
      )
    );
    setFlash((f) => f + 1);
    setRunning(false);
  };

  const stepMark = (s: StepState) => {
    if (s === "pass")
      return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <path d="m2.5 7 2.6 2.6L10.5 4" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    if (s === "fail")
      return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <path d="m3.5 3.5 6 6m0-6-6 6" stroke="#fda4af" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    if (s === "run")
      return <span className="block h-3 w-3 animate-spin rounded-full border-[1.5px] border-tealbr border-t-transparent" />;
    return <span className="block h-1.5 w-1.5 rounded-full bg-[#3d5375]" />;
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink3 bg-ink2 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">
          Request inspector
        </p>
        <span className="rounded border border-ink3 bg-ink px-2 py-1 font-mono text-[10px] text-mist">
          dev key · <span className="text-tealbr">whsec_ns_dev_9f27c1</span>{" "}
          <span className="text-faint">(demo)</span>
        </span>
      </div>

      {/* scenario picker */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              if (!running) {
                setScenario(s.id);
                setResponse(null);
                setSteps(["idle", "idle", "idle", "idle"]);
              }
            }}
            className={`rounded-lg border px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
              scenario === s.id
                ? "border-teal/60 bg-teal/10"
                : "border-ink3 bg-ink hover:border-[#3d5375]"
            }`}
          >
            <span className={`block text-[12.5px] font-semibold ${scenario === s.id ? "text-tealbr" : "text-paper"}`}>
              {s.label}
            </span>
            <span className="mt-0.5 block text-[10.5px] leading-snug text-faint">{s.hint}</span>
          </button>
        ))}
      </div>

      {/* headers preview */}
      <div className="mt-4 space-y-1 rounded-lg border border-ink3 bg-ink p-3 font-mono text-[11px]">
        <p className="text-faint">
          X-NS-Timestamp: <span className={scenario === "stale" ? "text-[#fcd34d]" : "text-[#d7e2f2]"}>{ts}</span>
          {scenario === "stale" && <span className="ml-2 text-[#fcd34d]">← 6 min old</span>}
        </p>
        <p className="text-faint">
          X-NS-Nonce: <span className={scenario === "replay" ? "text-[#fda4af]" : "text-[#d7e2f2]"}>{nonce}</span>
          {scenario === "replay" && <span className="ml-2 text-[#fda4af]">← already consumed</span>}
        </p>
        <p className="text-faint">
          body: <span className={scenario === "tamper" ? "text-[#fda4af]" : "text-[#d7e2f2]"}>
            {scenario === "tamper" ? "stock: 999 (signed as 118)" : "stock: 118"}
          </span>
        </p>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="mt-4 rounded-lg bg-tealbr px-5 py-2.5 font-display text-[14px] font-bold text-ink2 transition-all hover:bg-teal active:scale-[0.97] disabled:opacity-60"
      >
        {running ? "Verifying…" : "Send request →"}
      </button>

      {/* pipeline */}
      <ol className="mt-5 space-y-1.5">
        {VERIFY_STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-md border px-3 py-1.5 font-mono text-[11.5px] transition-colors duration-300 ${
              steps[i] === "pass"
                ? "border-[#6ee7b7]/25 bg-[#6ee7b7]/5 text-[#6ee7b7]"
                : steps[i] === "fail"
                ? "border-[#fda4af]/30 bg-[#fda4af]/8 text-[#fda4af]"
                : steps[i] === "run"
                ? "border-teal/40 bg-teal/8 text-tealbr"
                : "border-ink3 text-faint"
            }`}
          >
            {stepMark(steps[i])}
            {label}
          </li>
        ))}
      </ol>

      {/* response */}
      {response && (
        <div key={response + String(flash)} className={`pop mt-4 rounded-lg border p-3.5 ${RESPONSES[response].cls}`}>
          <p className="font-mono text-[11px] font-bold">
            HTTP/1.1 {RESPONSES[response].status} {response === "valid" ? "OK" : response === "replay" ? "Conflict" : response === "stale" ? "Bad Request" : "Unauthorized"}
          </p>
          <pre className="mt-1.5 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed opacity-90">
            {RESPONSES[response].body}
          </pre>
          <p className="mt-2 text-[10.5px] opacity-75">{RESPONSES[response].note}</p>
        </div>
      )}

      {/* store */}
      <div className="mt-auto pt-5">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-faint">
          live store · GET /inventory/:sku
        </p>
        <div className="mt-2 space-y-1">
          {store.map((r) => (
            <div
              key={r.sku}
              className={`flex items-center gap-3 rounded-md border border-ink3 bg-ink px-3 py-1.5 font-mono text-[11.5px] ${
                r.sku === "NS-1042" && flash > 0 ? "stock-flash" : ""
              }`}
            >
              <span className="text-[#d7e2f2]">{r.sku}</span>
              <span className="ml-auto font-bold text-tealbr">{r.stock}</span>
              <span className="text-faint">units</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${
                  r.source === "webhook:verified"
                    ? "bg-[#6ee7b7]/12 text-[#6ee7b7]"
                    : "bg-ink3 text-mist"
                }`}
              >
                {r.source}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Playground() {
  return (
    <section id="playground" className="relative overflow-hidden bg-ink2 py-20 sm:py-28">
      <div className="layer-grid-dark pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            dark
            kicker="Playground & API reference"
            title={
              <>
                Break it before
                <br />
                a supplier <span className="text-tealbr">does</span>.
              </>
            }
            blurb="The exact middleware that guards /webhooks/inventory, running live in your browser. Sign a request three different ways, or send one of four scenarios and watch the rejection ladder do its job."
          />
          <Reveal delay={120}>
            <p className="flex items-center gap-2 font-mono text-[11.5px] text-mist">
              <i className="led-green h-1.5 w-1.5 rounded-full bg-[#6ee7b7]" />
              sandbox · same logic as server/server.js
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <CodePanel />
          </Reveal>
          <Reveal delay={120} className="h-full">
            <Inspector />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
