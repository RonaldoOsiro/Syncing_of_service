import { useEffect, useState } from "react";
import { NAV_LINKS, SPRINT } from "../data";
import { SolsticeMark } from "../ui";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export function TopBar() {
  const now = useNow();
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-base/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <SolsticeMark />
          <span className="font-display text-[16px] font-bold leading-none tracking-tight text-ink">
            SOLSTICE
            <span className="block text-[9.5px] font-semibold tracking-[0.3em] text-solar">
              PIVOT ENGINE
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-dim transition-colors hover:text-solar"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden font-mono text-[11px] text-faint md:inline">
            {now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ·{" "}
            <span className="tabular-nums text-dim">
              {now.toLocaleTimeString("en-GB", { hour12: false })}
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-solar/40 bg-solar/10 px-3 py-1 font-mono text-[10.5px] font-bold tracking-wider text-solar">
            <i className="led h-1.5 w-1.5 rounded-full bg-solar" />
            {SPRINT.phase}
          </span>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-8 sm:px-8">
        <p className="font-display text-[14px] font-semibold text-dim">
          {SPRINT.client} — {SPRINT.service}
        </p>
        <p className="font-mono text-[11px] text-faint">
          {SPRINT.pivotId} · vendor: {SPRINT.vendor} · phase {SPRINT.phase}
        </p>
        <p className="ml-auto font-mono text-[11px] text-faint">
          queue + webhook · HMAC-SHA256 ·{" "}
          <span className="text-solar">doors open Saturday 09:00</span>
        </p>
      </div>
    </footer>
  );
}
