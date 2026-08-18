import { PIPELINE_STEPS, SECURITY_ROWS } from "../data";
import { Reveal } from "../hooks";
import { SectionHead } from "../ui";

const STEP_ICONS = [
  /* sign — key */
  <svg key="k" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="8" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12.2 12h8.3m-2.6 0v3.4m-3-3.4v2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>,
  /* deliver — parcel arrow */
  <svg key="d" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3.5 7.5 12 3.5l8.5 4v9l-8.5 4-8.5-4v-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>,
  /* verify — shield check */
  <svg key="v" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3 5 5.8v5.4c0 4.4 3 7.6 7 9.3 4-1.7 7-4.9 7-9.3V5.8L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="m8.8 12 2.3 2.3 4.1-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  /* store — database */
  <svg key="s" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" stroke="currentColor" strokeWidth="1.7" />
  </svg>,
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            kicker="How it works"
            title={
              <>
                Four steps between a warehouse
                <br className="hidden sm:block" /> and a <span className="text-teal">truthful answer</span>.
              </>
            }
          />
          <Reveal delay={120}>
            <p className="max-w-xs border-l-2 border-teal/40 pl-4 font-mono text-[12px] leading-relaxed text-slate">
              end-to-end in ~31ms — the support desk never sees a number that didn't survive step 03.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-16">
          {/* rail with travelling packet */}
          <div className="absolute left-0 right-0 top-[26px] hidden h-px bg-edge2 lg:block" aria-hidden>
            <i className="packet absolute -top-[3.5px] h-2 w-2 rounded-full bg-teal shadow-[0_0_12px_rgba(20,184,166,0.8)]" />
          </div>

          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {PIPELINE_STEPS.map((step, i) => (
              <Reveal as="li" key={step.n} delay={i * 110}>
                <div className="lift group h-full rounded-xl border border-edge bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-teal/25 bg-tealsoft/50 text-teal transition-colors group-hover:bg-teal group-hover:text-paper">
                      {STEP_ICONS[i]}
                    </span>
                    <span className="font-mono text-[12px] font-bold tracking-widest text-edge2 transition-colors group-hover:text-teal">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[19px] font-bold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate">{step.body}</p>
                  <code className="mt-4 inline-block rounded-md border border-edge bg-paper px-2.5 py-1 font-mono text-[10.5px] text-teal">
                    {step.code}
                  </code>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function Security() {
  return (
    <section id="security" className="relative border-y border-edge bg-card py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHead
              kicker="Security model"
              title={
                <>
                  Trust nothing.
                  <br />
                  Verify <span className="text-teal">everything</span>.
                </>
              }
              blurb="A webhook endpoint is a door that faces the public internet. Northstar Sync treats every request as hostile until it proves otherwise — three independent checks, in order, each one enough to reject."
            />
            <Reveal delay={140}>
              <div className="mt-8 rounded-xl border border-edge bg-paper p-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
                  rejection ladder
                </p>
                <ul className="mt-3 space-y-2 font-mono text-[12.5px]">
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-slate">malformed / missing headers</span>
                    <span className="rounded border border-amber/30 bg-ambersoft px-2 py-0.5 font-bold text-amber">400</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-slate">timestamp outside ±5 min</span>
                    <span className="rounded border border-amber/30 bg-ambersoft px-2 py-0.5 font-bold text-amber">400</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-slate">nonce already consumed</span>
                    <span className="rounded border border-rose/25 bg-rosesoft px-2 py-0.5 font-bold text-rose">409</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-slate">signature mismatch</span>
                    <span className="rounded border border-rose/25 bg-rosesoft px-2 py-0.5 font-bold text-rose">401</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-slate">all checks pass</span>
                    <span className="rounded border border-green/25 bg-greensoft px-2 py-0.5 font-bold text-green">200</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-7">
          {SECURITY_ROWS.map((row, i) => (
            <Reveal key={row.id} delay={i * 100}>
              <article className="lift group rounded-xl border border-edge bg-paper p-7 hover:border-teal/40 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-[21px] font-bold tracking-tight text-ink sm:text-[24px]">
                    {row.title}
                  </h3>
                  <span className="font-mono text-[11px] font-bold text-teal">{row.stat}</span>
                </div>
                <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-slate">{row.body}</p>
                <code className="mt-5 inline-block rounded-md border border-teal/25 bg-tealsoft/60 px-3 py-1.5 font-mono text-[11.5px] font-medium text-teal">
                  {row.tag}
                </code>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
