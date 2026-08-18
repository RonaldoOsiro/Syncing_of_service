import { CHANGELOG, DEPLOY_BLOCKS } from "../data";
import { Reveal } from "../hooks";
import { CopyBtn, SectionHead } from "../ui";

export function Deploy() {
  return (
    <section id="deploy" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            kicker="Deploy"
            title={
              <>
                Ship it <span className="text-teal">anywhere</span>.
              </>
            }
            blurb="Both halves of Northstar Sync deploy in one command each — the site is a static SPA, the API is a single Node process. Every host config below is already committed to the repo."
          />
          <Reveal delay={120}>
            <p className="max-w-xs border-l-2 border-amber/50 pl-4 font-mono text-[12px] leading-relaxed text-slate">
              one rule: the host's WEBHOOK_SECRET must match your signer's — and it's never the dev placeholder.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {DEPLOY_BLOCKS.map((block, i) => (
            <Reveal key={block.id} delay={i * 100} className="h-full">
              <div className="lift flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-card">
                <div className="flex items-center gap-2.5 border-b border-edge px-5 py-3">
                  <span className="flex gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-full bg-[#f1a3a0]" />
                    <i className="h-2.5 w-2.5 rounded-full bg-[#e8c37e]" />
                    <i className="h-2.5 w-2.5 rounded-full bg-[#9ad1a8]" />
                  </span>
                  <p className="font-mono text-[11.5px] font-semibold text-slate">{block.title}</p>
                  <span className="ml-auto">
                    <CopyBtn text={block.lines.join("\n")} />
                  </span>
                </div>
                <div className="term-scroll flex-1 overflow-x-auto bg-ink2 p-5">
                  {block.lines.map((line, j) => (
                    <p key={j} className="whitespace-pre font-mono text-[12px] leading-7">
                      {line.startsWith("#") ? (
                        <span className="text-[#7e93b5]">{line}</span>
                      ) : (
                        <>
                          <span className="mr-2 select-none text-tealbr">$</span>
                          <span className="text-[#d7e2f2]">{line.replace(/^\$ /, "")}</span>
                        </>
                      )}
                    </p>
                  ))}
                </div>
                <p className="border-t border-edge bg-paper/70 px-5 py-3 font-mono text-[10.5px] leading-relaxed text-faint">
                  {block.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={160}>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              committed configs →
            </span>
            {["netlify.toml", "vercel.json", "server/Dockerfile", "server/fly.toml", "render.yaml", "server/send.sh"].map((f) => (
              <code
                key={f}
                className="rounded-md border border-edge bg-card px-2.5 py-1 font-mono text-[11px] text-slate transition-colors hover:border-teal/50 hover:text-teal"
              >
                {f}
              </code>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ShipLog() {
  return (
    <section id="changelog" className="relative border-t border-edge bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          kicker="Ship log"
          title={
            <>
              Built in the open,
              <br />
              logged <span className="text-teal">honestly</span>.
            </>
          }
          blurb="Northstar Sync shipped from the Meridian Pivot sprint — two days, one developer, three real blockers found and fixed along the way. This is the record."
        />

        <Reveal delay={120}>
          <article className="lift mt-12 overflow-hidden rounded-2xl border border-edge bg-paper">
            <header className="flex flex-wrap items-center gap-4 border-b border-edge px-7 py-5">
              <span className="rounded-lg bg-ink px-3 py-1.5 font-mono text-[13px] font-bold text-tealbr">
                {CHANGELOG.version}
              </span>
              <div>
                <h3 className="font-display text-[21px] font-bold tracking-tight text-ink">
                  {CHANGELOG.name}
                </h3>
                <p className="font-mono text-[11px] text-faint">{CHANGELOG.date} · Meridian Pivot, days 1–2 · solo build</p>
              </div>
              <span className="ml-auto rounded-full border border-green/30 bg-greensoft px-3 py-1 font-mono text-[10.5px] font-bold text-green">
                released
              </span>
            </header>

            <div className="grid gap-8 px-7 py-7 md:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-teal">Added</p>
                <ul className="mt-4 space-y-2.5">
                  {CHANGELOG.added.map((item) => (
                    <li key={item} className="flex gap-3 text-[13.5px] leading-relaxed text-slate">
                      <span className="mt-0.5 shrink-0 font-mono text-[12px] font-bold text-teal">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-rose">
                  Fixed during build
                </p>
                <ul className="mt-4 space-y-2.5">
                  {CHANGELOG.fixed.map((f) => (
                    <li key={f.id} className="flex gap-3 text-[13.5px] leading-relaxed text-slate">
                      <code className="mt-0.5 h-fit shrink-0 rounded border border-rose/25 bg-rosesoft px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose">
                        {f.id}
                      </code>
                      {f.text}
                    </li>
                  ))}
                </ul>

                <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-faint">
                  On the roadmap
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHANGELOG.roadmap.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-edge bg-card px-3 py-1 font-mono text-[11px] text-slate transition-colors hover:border-teal/50 hover:text-teal"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
