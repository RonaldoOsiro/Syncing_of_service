import { Alternates, Modules, Signals } from "./components/Sections";
import { LiveSpark } from "./components/LiveSpark";
import { Terminal } from "./components/Terminal";
import { COMMIT, DIFFSTAT } from "./data";
import { Reveal } from "./hooks";

/* ---------- ambient background ---------- */
function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div className="glow animate-drift-a -top-32 left-[-10%] h-[420px] w-[520px] bg-teal/10" />
      <div className="glow animate-drift-b top-[30%] right-[-12%] h-[380px] w-[460px] bg-amber/10" />
      <div className="glow bottom-[-15%] left-[20%] h-[360px] w-[460px] bg-sky/10" />
      <span className="float-sig absolute top-[16%] right-[4%] hidden select-none font-mono text-[13px] text-edge2 lg:block">
        @@ -812,14 +812,125 @@
      </span>
      <span className="float-sig absolute bottom-[22%] left-[3%] hidden select-none font-mono text-[13px] text-edge2 lg:block [animation-delay:-4s]">
        + setInterval(liveTick, 5000);
      </span>
    </div>
  );
}

/* ---------- top bar ---------- */
function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge/80 bg-night/95">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 md:px-8">
        <span className="flex items-center gap-2 font-mono text-xs text-dim">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-amber">
            <circle cx="3.4" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="11.6" cy="3.4" r="2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="11.6" cy="11.6" r="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5.3 6.8 9.7 4.1M5.3 8.2l4.4 2.7" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="hidden text-faint sm:inline">northstar-sprint /</span>
          <span className="text-ink">cx-automation-demo</span>
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-edge bg-panel px-2.5 py-0.5 font-mono text-[11px] text-sky sm:inline-flex">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M3.5 1.5 1.5 5.5l2 4M7.5 1.5l2 4-2 4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {COMMIT.branch}
        </span>
        <span className="ml-auto hidden font-mono text-[11px] md:inline">
          <span className="text-lime">+{DIFFSTAT.added}</span>{" "}
          <span className="text-rose">−{DIFFSTAT.removed}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-lime">
          <i className="blink-dot h-1.5 w-1.5 rounded-full bg-lime" />
          build passing
        </span>
      </div>
    </header>
  );
}

/* ---------- diffstat card ---------- */
function DiffStat() {
  return (
    <div className="panel-hover rounded-xl border border-edge bg-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
        diffstat
      </p>
      <div className="mt-3 flex items-center gap-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-sky">
          <path
            d="M2 4.2h10M2 7h10M2 9.8h6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span className="truncate font-mono text-[12.5px] text-ink">
          {DIFFSTAT.path}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[11.5px]">
          <span className="text-lime">+{DIFFSTAT.added}</span>{" "}
          <span className="text-rose">−{DIFFSTAT.removed}</span>
        </span>
      </div>
      <div className="mt-3 flex gap-1">
        {DIFFSTAT.cells.map((c, i) => (
          <i
            key={i}
            className={`diff-cell ${c === "add" ? "bg-lime/80" : "bg-rose/80"}`}
          />
        ))}
        <span className="ml-2 self-center font-mono text-[10.5px] text-faint">
          {DIFFSTAT.files}
        </span>
      </div>
    </div>
  );
}

/* ---------- verdict card ---------- */
function Verdict() {
  const rows = [
    { k: "type", v: "feat", c: "text-lime" },
    { k: "scope", v: "dashboard", c: "text-sky" },
    { k: "rides along", v: "fix(ui) wiring", c: "text-amber" },
    { k: "breaking", v: "no", c: "text-dim" },
  ];
  return (
    <div className="panel-hover rounded-xl border border-edge bg-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
        verdict
      </p>
      <ul className="mt-2 divide-y divide-edge/60">
        {rows.map((r) => (
          <li key={r.k} className="flex items-baseline justify-between py-2">
            <span className="text-[12.5px] text-dim">{r.k}</span>
            <span className={`font-mono text-[12.5px] font-semibold ${r.c}`}>
              {r.v}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] leading-relaxed text-faint">
        The dashboard and feed are net-new; the repaired wiring tags along in
        the body rather than stealing the subject.
      </p>
    </div>
  );
}

/* ---------- page ---------- */
export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-body text-ink">
      <Backdrop />
      <TopBar />

      <main className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
        {/* opening: the commit itself */}
        <section className="grid gap-8 pt-10 pb-16 sm:pt-14 lg:grid-cols-12 lg:pt-16">
          <div className="lg:col-span-12">
            <Reveal>
              <p className="font-mono text-xs tracking-widest text-amber">
                // code review → commit message
              </p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
                The snippet talks.
                <br />
                <span className="text-dim">This is what it says.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-dim">
                You pasted the tail of <strong className="font-semibold text-ink">NorthStar Sprint</strong>'s
                support-deflection demo — SVG dashboard renderers, a 5-second
                simulated feed, and event wiring explicitly flagged{" "}
                <code className="rounded border border-amber/30 bg-amber/10 px-1.5 py-0.5 font-mono text-[12px] text-amber">
                  (fixed)
                </code>
                . Below is the commit message it earns — copy it straight into{" "}
                <code className="font-mono text-[12.5px] text-sky">git commit</code>{" "}
                — with the full analysis underneath.
              </p>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-8">
            <Terminal />
          </Reveal>

          <div className="space-y-4 lg:col-span-4">
            <Reveal delay={200}>
              <DiffStat />
            </Reveal>
            <Reveal delay={280}>
              <LiveSpark />
            </Reveal>
            <Reveal delay={360}>
              <Verdict />
            </Reveal>
          </div>
        </section>

        <Modules />
        <Signals />
        <Alternates />
      </main>

      <footer className="relative z-10 border-t border-edge/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 font-mono text-[11px] text-faint md:px-8">
          <span>
            $ git log -1 <span className="text-sky">{COMMIT.sha}</span>
          </span>
          <span className="hidden sm:inline">·</span>
          <span>single-file vanilla-js demo · es5 · no frameworks were harmed</span>
          <span className="ml-auto text-edge2">northstar-sprint © 2026</span>
        </div>
      </footer>
    </div>
  );
}
