import { SCENARIOS, SPRINT } from "../data";
import { Reveal } from "../hooks";
import type { Attendee, ScenarioId, useSimulation } from "../sim";
import { HttpChip, SectionHead } from "../ui";

type SimApi = ReturnType<typeof useSimulation>;

/* ---------- deterministic QR-ish pattern ---------- */
function qrCells(seed: string): boolean[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells: boolean[] = [];
  for (let i = 0; i < 81; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    cells.push(((h >>> 24) & 1) === 1);
  }
  return cells;
}

function QrBlock({ seed, tone }: { seed: string; tone: "dim" | "teal" }) {
  const cells = qrCells(seed);
  const fill = tone === "teal" ? "#2dd4bf" : "#4f6079";
  return (
    <svg width="58" height="58" viewBox="0 0 27 27" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="26" height="26" rx="2" fill="none" stroke={fill} strokeWidth="1" opacity="0.5" />
      {cells.map((on, i) =>
        on ? (
          <rect key={i} x={1 + (i % 9) * 2.8} y={1 + Math.floor(i / 9) * 2.8} width="2" height="2" fill={fill} />
        ) : null
      )}
    </svg>
  );
}

/* ---------- pivot notice ---------- */
export function PivotBanner() {
  return (
    <div className="border-b border-solar/30 bg-solar/[0.07]">
      <div className="mx-auto flex max-w-7xl items-start gap-4 px-5 py-3.5 sm:items-center sm:px-8">
        <span className="mt-0.5 shrink-0 sm:mt-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3 2.5 20h19L12 3Z" stroke="#fbbf24" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M12 9.5v4.5" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" fill="#fbbf24" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-solar">
            VENDOR DEPRECATION · T-72H · {SPRINT.pivotId}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-dim">
            {SPRINT.notice}
          </p>
        </div>
        <span className="ml-auto hidden shrink-0 rounded-md border border-solar/40 px-2.5 py-1 font-mono text-[10.5px] font-bold text-solar xl:block">
          NO EXTENSIONS
        </span>
      </div>
    </div>
  );
}

/* ---------- attendee badge card ---------- */
const STATE_STYLE: Record<
  Attendee["state"],
  { label: string; chip: string; ring: string; bar: string }
> = {
  NOT_CHECKED_IN: {
    label: "NOT CHECKED IN",
    chip: "border-edge2 bg-panel text-dim",
    ring: "border-edge",
    bar: "bg-edge2",
  },
  PENDING_PRINT: {
    label: "PENDING PRINT",
    chip: "border-solar/50 bg-solar/10 text-solar",
    ring: "border-solar/50",
    bar: "bg-solar bar-live",
  },
  CHECKED_IN: {
    label: "CHECKED IN",
    chip: "border-teal/50 bg-teal/10 text-teal",
    ring: "border-teal/50",
    bar: "bg-teal",
  },
};

function BadgeCard({ att, onScan, fb }: { att: Attendee; onScan: () => void; fb?: SimApi["sim"]["feedback"][string] }) {
  const s = STATE_STYLE[att.state];
  const fbTone =
    fb?.kind === "accept"
      ? "border-teal/40 bg-teal/10 text-teal"
      : fb?.kind === "verified"
      ? "border-teal/40 bg-teal/10 text-teal"
      : fb?.kind === "forged"
      ? "border-rose/40 bg-rose/10 text-rose"
      : "border-solar/40 bg-solar/10 text-solar";

  return (
    <article
      className={`panel-hover relative overflow-hidden rounded-xl border-2 bg-panel p-5 ${s.ring}`}
    >
      {/* lanyard slot */}
      <span className="absolute left-1/2 top-2.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-base shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]" />

      {fb?.kind === "accept" && (
        <span
          key={fb.key}
          className="scanline pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-teal/25 to-transparent"
        />
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.2em] text-faint">{att.tier.toUpperCase()}</p>
          <h3 className="mt-1 truncate font-display text-xl font-bold tracking-tight text-ink">{att.name}</h3>
          <p className="mt-0.5 font-mono text-[12px] text-dim">{att.ticket}</p>
        </div>
        <QrBlock seed={att.ticket} tone={att.state === "CHECKED_IN" ? "teal" : "dim"} />
      </div>

      <p className="mt-3 min-h-[2.4em] text-[12px] leading-snug text-faint">{att.note}</p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-base">
        <div className={`h-full rounded-full transition-all duration-700 ${s.bar}`} style={{ width: att.state === "NOT_CHECKED_IN" ? "8%" : att.state === "PENDING_PRINT" ? "58%" : "100%" }} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          key={att.state + (att.checkedInAt ?? "")}
          className={`badge-flip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-wider ${s.chip}`}
        >
          {att.state === "PENDING_PRINT" && <i className="pulse-amber h-1.5 w-1.5 rounded-full bg-solar" />}
          {att.state === "CHECKED_IN" && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 6.4 4.7 9 10 3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {s.label}
        </span>
        {att.checkedInAt && (
          <span className="font-mono text-[10.5px] text-faint">@ {att.checkedInAt}</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          onClick={onScan}
          className="group flex-1 rounded-lg border border-edge2 bg-panel2 px-3 py-2 font-mono text-[11.5px] font-bold tracking-wider text-ink transition-all hover:border-solar/60 hover:bg-solar/10 hover:text-solar active:scale-[0.97]"
        >
          <span className="inline-flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 5V3a1 1 0 0 1 1-1h2M11 2h2a1 1 0 0 1 1 1v2M14 11v2a1 1 0 0 1-1 1h-2M5 14H3a1 1 0 0 1-1-1v-2M1.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            SCAN QR
          </span>
        </button>
        {fb && (
          <span key={fb.key} className={`pop inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px] ${fbTone}`}>
            <HttpChip code={fb.http} />
            <span className="hidden xl:inline">{fb.kind === "reject" ? "blocked" : fb.kind === "forged" ? "forged" : fb.kind === "verified" ? "verified" : "queued"}</span>
          </span>
        )}
      </div>
    </article>
  );
}

/* ---------- queue rail ---------- */
const STAGE_STYLE: Record<string, string> = {
  queued: "border-sky/40 bg-sky/10 text-sky",
  printing: "border-solar/40 bg-solar/10 text-solar",
  dispatched: "border-edge2 bg-panel2 text-dim",
  confirmed: "border-teal/40 bg-teal/10 text-teal",
  rejected: "border-rose/40 bg-rose/10 text-rose",
};

function QueueRail({ sim }: { sim: SimApi["sim"] }) {
  return (
    <div className="rounded-xl border border-edge bg-deep p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-faint">
          BADGE-PRINT QUEUE
        </p>
        <span className="font-mono text-[10.5px] text-faint">
          {sim.jobs.length} job{sim.jobs.length === 1 ? "" : "s"} · worker ×1
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1 font-mono text-[9.5px] tracking-wider text-faint">
        {["PUBLISH", "QUEUE", "PRINTER", "WEBHOOK", "CHECKED IN"].map((step, i) => (
          <span key={step} className="flex flex-1 items-center gap-1">
            <span className="whitespace-nowrap rounded border border-edge bg-panel px-1.5 py-0.5">{step}</span>
            {i < 4 && <span className="h-px flex-1 bg-edge" />}
          </span>
        ))}
      </div>

      <div className="mt-4 min-h-[92px] space-y-2">
        {sim.jobs.length === 0 && (
          <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center font-mono text-[11.5px] text-faint">
            queue idle — scan an attendee to publish a print job
          </p>
        )}
        {sim.jobs.map((job) => (
          <div
            key={job.id}
            className={`flex items-center gap-3 rounded-lg border border-edge bg-panel px-3.5 py-2.5 ${
              job.stage === "queued" || job.stage === "printing" ? "job-hot" : ""
            }`}
          >
            <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${STAGE_STYLE[job.stage]}`}>
              {job.stage}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-dim">
              {job.id} <span className="text-faint">· {job.name}</span>
            </span>
            {job.corrupt && job.stage !== "rejected" && (
              <span className="rounded border border-rose/40 px-1.5 py-0.5 font-mono text-[9.5px] text-rose">
                sim: vendor will mis-sign
              </span>
            )}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={job.stage === "printing" ? "animate-spin text-solar" : "text-faint"} style={{ animationDuration: "1.2s" }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="24" strokeDashoffset={job.stage === "queued" ? "18" : job.stage === "printing" ? "10" : "0"} strokeLinecap="round" transform="rotate(-90 8 8)" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- webhook inbox ---------- */
function WebhookInbox({ sim }: { sim: SimApi["sim"] }) {
  return (
    <div className="rounded-xl border border-edge bg-deep p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-faint">
          WEBHOOK RECEIVER · POST /vendor/print-events
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-teal">
          HMAC-SHA256
        </span>
      </div>

      <div className="mt-4 min-h-[92px] space-y-2">
        {sim.callbacks.length === 0 && (
          <p className="rounded-lg border border-dashed border-edge px-4 py-6 text-center font-mono text-[11.5px] text-faint">
            no callbacks yet — the vendor signs <span className="text-dim">jobId.status.ts</span> with the shared secret
          </p>
        )}
        {sim.callbacks.map((cb) => (
          <div key={cb.id} className="pop flex items-center gap-3 rounded-lg border border-edge bg-panel px-3.5 py-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-bold ${
                cb.sigOk ? "border-teal/50 bg-teal/10 text-teal" : "border-rose/50 bg-rose/10 text-rose"
              }`}
            >
              {cb.sigOk ? "✓" : "✕"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11.5px] text-dim">
                {cb.jobId} <span className="text-faint">· {cb.ts}</span>
              </p>
              <p className={`truncate text-[11px] ${cb.sigOk ? "text-faint" : "text-rose/80"}`}>{cb.note}</p>
            </div>
            <HttpChip code={cb.http} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- test harness ---------- */
function Harness({ api }: { api: SimApi }) {
  const { sim, runScenario, runAll, reset } = api;

  const FLAG_ROWS: { label: string; on: boolean }[] = [
    { label: "Job published to queue", on: sim.flags.queuePublished },
    { label: "PENDING_PRINT reached", on: sim.flags.pendingPrintSeen },
    { label: "Signed webhook verified", on: sim.flags.webhookVerified },
    { label: "Dup blocked · PENDING_PRINT", on: sim.flags.dupBlockedPending },
    { label: "Dup blocked · CHECKED_IN", on: sim.flags.dupBlockedCheckedIn },
    { label: "Forged signature → 403", on: sim.flags.tamperRejected },
    { label: "Stale job id → 409", on: sim.flags.staleRejected },
  ];

  return (
    <aside id="harness" className="lg:sticky lg:top-24">
      <div className="rounded-xl border border-edge bg-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-faint">
            VERIFICATION HARNESS
          </p>
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] ${sim.running ? "text-solar" : "text-faint"}`}>
            <i className={`h-1.5 w-1.5 rounded-full ${sim.running ? "pulse-amber bg-solar" : "bg-edge2"}`} />
            {sim.running ? "executing" : "armed"}
          </span>
        </div>

        <ul className="mt-4 space-y-2.5">
          {SCENARIOS.map((sc) => {
            const status = sim.scenarios[sc.id as ScenarioId];
            return (
              <li key={sc.id} className="rounded-lg border border-edge bg-deep p-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-[10.5px] font-bold ${
                      status === "pass"
                        ? "border-teal/50 bg-teal/10 text-teal"
                        : status === "running"
                        ? "border-solar/50 bg-solar/10 text-solar"
                        : "border-edge2 text-faint"
                    }`}
                  >
                    {sc.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-tight text-ink">{sc.title}</p>
                    <p className="truncate font-mono text-[10px] text-faint">{sc.target}</p>
                  </div>
                  <button
                    onClick={() => void runScenario(sc.id as ScenarioId)}
                    disabled={sim.running}
                    className="rounded-md border border-edge2 px-2.5 py-1 font-mono text-[10.5px] font-bold text-dim transition-all hover:border-solar/60 hover:text-solar active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {status === "running" ? "…" : status === "pass" ? "re-run" : "run"}
                  </button>
                </div>
                <p className="mt-2 border-t border-edge/60 pt-2 text-[11px] leading-snug text-faint">
                  <span className="font-mono text-[9.5px] tracking-wider text-solar">EXPECT · </span>
                  {sc.expect}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => void runAll()}
            disabled={sim.running}
            className="flex-1 rounded-lg bg-solar px-3 py-2.5 font-display text-[13.5px] font-bold text-base transition-all hover:bg-ember active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sim.running ? "Running suite…" : "Run full simulation"}
          </button>
          <button
            onClick={reset}
            disabled={sim.running}
            className="rounded-lg border border-edge2 px-3.5 py-2.5 font-mono text-[12px] font-bold text-dim transition-all hover:border-rose/60 hover:text-rose active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            title="Reset the floor to baseline"
          >
            reset
          </button>
        </div>

        <div className="mt-5 border-t border-edge pt-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-faint">LIVE GUARDRAIL FLAGS</p>
          <ul className="mt-2.5 space-y-1.5">
            {FLAG_ROWS.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 font-mono text-[11.5px]">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                    f.on ? "border-teal/60 bg-teal/15 text-teal" : "border-edge2 text-faint"
                  }`}
                >
                  {f.on && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6.4 4.7 9 10 3.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={f.on ? "text-dim" : "text-faint"}>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

/* ---------- the floor ---------- */
export function Floor({ api }: { api: SimApi }) {
  const { sim, scan } = api;
  return (
    <section id="floor" className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
      <SectionHead
        kicker="// STEP 1 — BASE STATE → REFACTORED FLOOR"
        title="The kiosk floor, running the async build"
        blurb={
          <>
            Three test attendees, one pre-seeded duplicate case. The sync path is gone — every scan
            answers <span className="font-mono text-[13px] text-solar">202 Accepted</span>, publishes to the
            badge-print queue, and the badge reveals only when a{" "}
            <span className="text-teal">signed webhook</span> lands. Scan anyone — the guardrails are live.
          </>
        }
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {sim.attendees.map((att, i) => (
              <Reveal key={att.id} delay={i * 90}>
                <BadgeCard att={att} onScan={() => scan(att.id)} fb={sim.feedback[att.id]} />
              </Reveal>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Reveal delay={120}>
              <QueueRail sim={sim} />
            </Reveal>
            <Reveal delay={200}>
              <WebhookInbox sim={sim} />
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-4">
          <Reveal delay={140}>
            <Harness api={api} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
