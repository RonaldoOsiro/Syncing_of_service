import { NAV_LINKS } from "../data";
import { NorthstarMark, StatusPill } from "../ui";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <NorthstarMark />
          <span className="font-display text-[17px] font-bold tracking-tight text-ink">
            Northstar <span className="text-teal">Sync</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13.5px] font-medium text-slate transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden md:block">
            <StatusPill />
          </span>
          <a
            href="#playground"
            className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-paper shadow-sm transition-all hover:bg-teal active:scale-[0.97]"
          >
            Get API key
          </a>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Security model", href: "#security" },
      { label: "Live playground", href: "#playground" },
      { label: "Integrations", href: "#partners" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API reference", href: "#playground" },
      { label: "Deploy guides", href: "#deploy" },
      { label: "Ship log", href: "#changelog" },
      { label: "Express docs", href: "https://expressjs.com", external: true },
      { label: "node:crypto", href: "https://nodejs.org/api/crypto.html", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Northstar Retail Co.", href: "#top" },
      { label: "Meridian Pivot sprint", href: "#changelog" },
      { label: "System status", href: "#top" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-ink3 bg-ink2 text-paper">
      <div className="layer-grid-dark pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <a href="#top" className="flex items-center gap-2.5">
              <NorthstarMark />
              <span className="font-display text-[18px] font-bold tracking-tight">
                Northstar <span className="text-tealbr">Sync</span>
              </span>
            </a>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-mist">
              Verified inventory webhooks for Northstar Retail Co. — every stock
              count your support team quotes is cryptographically signed, replay-proof,
              and fresh to the second.
            </p>
            <div className="mt-6">
              <StatusPill dark />
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="text-[13.5px] text-mist transition-colors hover:text-tealbr"
                    >
                      {l.label}
                      {l.external && <span className="ml-1 text-[10px] text-faint">↗</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1" />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink3 pt-6 font-mono text-[11.5px] text-faint">
          <span>© 2026 Northstar Retail Co.</span>
          <span className="text-ink3">|</span>
          <span>v0.1.0 · first light</span>
          <span className="text-ink3">|</span>
          <span>every signature verified</span>
          <span className="ml-auto text-mist">
            built during <span className="text-tealbr">Meridian Pivot</span> · days 1–2
          </span>
        </div>
      </div>
    </footer>
  );
}
