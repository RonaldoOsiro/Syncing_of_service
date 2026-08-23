import { useEffect, useRef } from "react";
import { Reveal } from "../hooks";
import type { useSimulation } from "../sim";
import { CopyBtn, SectionHead } from "../ui";

type SimApi = ReturnType<typeof useSimulation>;

const ACTION_TONE: Record<string, string> = {
  ADDED: "text-teal",
  MODIFIED: "text-solar",
  DROPPED: "text-rose",
};

function Entry({ e }: { e: SimApi["sim"]["trail"][number] }) {
  const verified = e.security_status === "VERIFIED_HMAC";
  return (
    <div className="rounded-lg border border-edge bg-panel px-4 py-3 font-mono text-[11.5px] leading-relaxed">
      <p className="text-faint">{e.timestamp}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded border border-edge2 bg-deep px-1.5 py-0.5 text-[10px] text-dim">{e.sprint_phase}</span>
        <span className="text-ink">{e.component_changed}</span>
        <span className={`font-bold ${ACTION_TONE[e.action_taken] ?? "text-dim"}`}>{e.action_taken}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            verified ? "border border-teal/40 bg-teal/10 text-teal" : "border border-edge2 bg-deep text-faint"
          }`}
        >
          {e.security_status}
        </span>
      </p>
      <p className="mt-1.5 text-dim">{e.audit_note}</p>
    </div>
  );
}

export function Trail({ api }: { api: SimApi }) {
  const { sim } = api;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sim.trail.length]);

  const fullLog = JSON.stringify(sim.trail, null, 2);

  return (
    <section id="trail" className="border-t border-edge/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            kicker="// TRAIL — AUDIT & TRACEABILITY"
            title="Every change, appended to the record"
            blurb="The running log the evaluation is graded against: baseline build, pivot injection, and every refactor action — plus each scan and callback as it happens above."
          />
          <Reveal delay={120} className="flex flex-wrap items-center gap-2 pb-2">
            {["ORIGINAL_BUILD", "PIVOT_INJECTED", "REFACTOR_AUDIT"].map((p) => (
              <span key={p} className="rounded-full border border-edge bg-panel px-3 py-1 font-mono text-[10.5px] text-faint">
                {p}
              </span>
            ))}
            <CopyBtn text={fullLog} label="copy trail.json" />
          </Reveal>
        </div>

        <Reveal delay={100} className="mt-8">
          <div className="overflow-hidden rounded-xl border border-edge bg-deep">
            <div className="flex items-center justify-between border-b border-edge bg-panel px-4 py-2.5">
              <span className="flex items-center gap-2 font-mono text-[11px] text-faint">
                <i className="led h-1.5 w-1.5 rounded-full bg-lime" />
                trail.log — append-only
              </span>
              <span className="font-mono text-[10.5px] text-faint">
                {sim.trail.length} entries · schema v1
              </span>
            </div>
            <div ref={scrollRef} className="term-scroll max-h-[520px] space-y-2.5 overflow-y-auto p-4">
              {sim.trail.map((e, i) => (
                <div key={i} className={i >= sim.trail.length - 3 ? "pop" : ""}>
                  <Entry e={e} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={140} className="mt-6">
          <p className="rounded-lg border border-edge/70 bg-panel/60 px-4 py-3 font-mono text-[11px] leading-relaxed text-faint">
            schema — <span className="text-dim">timestamp</span> ISO-8601 ·{" "}
            <span className="text-dim">sprint_phase</span> ORIGINAL_BUILD | PIVOT_INJECTED | REFACTOR_AUDIT ·{" "}
            <span className="text-dim">component_changed</span> route or unit ·{" "}
            <span className="text-dim">action_taken</span> DROPPED | ADDED | MODIFIED ·{" "}
            <span className="text-dim">security_status</span> VERIFIED_HMAC | UNVERIFIED ·{" "}
            <span className="text-dim">audit_note</span> free text
          </p>
        </Reveal>
      </div>
    </section>
  );
}
