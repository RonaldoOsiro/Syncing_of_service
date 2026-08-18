import { BLOCKERS, RESOURCES, SPRINT, VALIDATION } from "../data";
import { Reveal } from "../hooks";
import { SectionHead, TermLine } from "../ui";

function Resources() {
  return (
    <div>
      <h3 className="font-mono text-[11px] tracking-[0.16em] text-faint">
        1 · PRIMARY DOCUMENTATION & RESOURCES CONSULTED
      </h3>
      <ul className="mt-4 divide-y divide-edge/70 rounded-xl border border-edge bg-panel">
        {RESOURCES.map((r, i) => (
          <Reveal as="li" key={r.src} delay={i * 70} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-display text-[15px] font-semibold text-ink">{r.src}</span>
              <code className="font-mono text-[11px] text-sky">{r.url}</code>
            </div>
            <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-dim">
              <span className="mr-2 font-mono text-[10.5px] uppercase tracking-wider text-faint">
                takeaway
              </span>
              {r.takeaway}
            </p>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

function BlockerCard({ index }: { index: number }) {
  const b = BLOCKERS[index];
  return (
    <Reveal as="li" delay={(index % 2) * 90}>
      <article className="panel-hover overflow-hidden rounded-xl border border-edge bg-panel">
        <header className="flex flex-wrap items-center gap-3 border-b border-edge bg-panel2/50 px-5 py-3.5">
          <span className="rounded-md border border-rose/40 bg-rose/10 px-2 py-0.5 font-mono text-[11px] font-bold text-rose">
            BLOCKER #{b.id}
          </span>
          <h4 className="font-display text-[16.5px] font-semibold leading-snug text-ink">
            {b.title}
          </h4>
          <span className="ml-auto rounded-full border border-edge bg-deep px-3 py-1 font-mono text-[10.5px] text-dim">
            {b.phase}
          </span>
        </header>
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-edge/70 p-5 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-rose/80">
              Exact error log / symptom
            </p>
            <pre className="term-scroll mt-2.5 overflow-x-auto rounded-lg border border-rose/25 bg-base p-3.5">
              {b.error.map((line, i) => (
                <p key={i} className="whitespace-pre-wrap break-all font-mono text-[11.5px] leading-relaxed text-rose/90">
                  {line}
                </p>
              ))}
            </pre>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-amber">
                Root cause
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{b.root}</p>
            </div>
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-teal">
                Resolution path
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{b.fix}</p>
            </div>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function Verification() {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-xl border border-lime/30 bg-deep">
        <div className="flex flex-wrap items-center gap-4 border-b border-edge bg-panel px-5 py-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-faint">
              3 · VERIFICATION & FUNCTIONAL STATUS
            </p>
            <p className="mt-1 font-display text-[17px] font-semibold text-ink">
              End-to-end, from the terminal — every path exercised
            </p>
          </div>
          <span className="ml-auto -rotate-3 rounded-lg border-2 border-lime/70 px-4 py-1.5 font-display text-[22px] font-bold tracking-[0.2em] text-lime">
            PASS
          </span>
        </div>
        <div className="term-scroll max-h-[420px] overflow-y-auto p-5">
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-faint">VALIDATION OUTPUT</p>
          <div className="mt-3 space-y-1.5">
            {VALIDATION.map((l, i) => (
              <TermLine key={i} kind={l.t} text={l.text} />
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Journal() {
  return (
    <section className="border-t border-edge/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          kicker="// STEP 3 — LEARNING & BLOCKER JOURNAL"
          title="Assignment 1: Learning & Blocker Journal"
          blurb={
            <>
              <span className="text-ink">Assigned Tool/Concept:</span> {SPRINT.tool} (
              {SPRINT.concept}) · <span className="text-ink">Time-Box Target:</span>{" "}
              {SPRINT.targetHours.toFixed(1)} Hours · <span className="text-ink">Actual Time Spent:</span>{" "}
              <span className="text-teal">{SPRINT.actualHours.toFixed(1)} Hours</span>
            </>
          }
        />

        <div className="mt-12 space-y-14">
          <Resources />

          <div>
            <h3 className="font-mono text-[11px] tracking-[0.16em] text-faint">
              2 · CHRONOLOGICAL BLOCKER & TROUBLESHOOTING LOG
            </h3>
            <ul className="mt-4 space-y-5">
              {BLOCKERS.map((_, i) => (
                <BlockerCard key={i} index={i} />
              ))}
            </ul>
          </div>

          <Verification />
        </div>

        <Reveal delay={100} className="mt-10">
          <p className="rounded-lg border border-edge/70 bg-panel/60 px-4 py-3 text-center font-mono text-[11.5px] text-faint">
            Logged solo — no instructor or teammate assistance at any point in this time-box.
            Every error above was reproduced, diagnosed, and fixed inside the sprint.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
