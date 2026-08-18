import { Codebase } from "./components/CodeViewer";
import { Journal } from "./components/Journal";
import { Opening, TopBar } from "./components/Opening";
import { Runbook } from "./components/Runbook";
import { WebhookLab } from "./components/WebhookLab";
import { SPRINT } from "./data";

export default function App() {
  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="layer-glow absolute inset-0" />
        <div className="layer-grid absolute inset-0" />
        <div className="layer-noise absolute inset-0" />
      </div>

      <div className="relative z-10">
        <TopBar />
        <main>
          <Opening />
          <WebhookLab />
          <Codebase />
          <Runbook />
          <Journal />
        </main>

        <footer className="border-t border-edge/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-8 sm:px-8">
            <p className="font-display text-[14px] font-semibold text-dim">
              {SPRINT.program} · {SPRINT.assignment} — {SPRINT.tool}
            </p>
            <p className="font-mono text-[11px] text-faint">
              {SPRINT.company} · live inventory sync · built & verified solo in{" "}
              {SPRINT.actualHours.toFixed(1)}h
            </p>
            <p className="ml-auto font-mono text-[11px] text-faint">
              node 20 · express 4 · HMAC-SHA256 ·{" "}
              <span className="text-lime">status: {SPRINT.status}</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
