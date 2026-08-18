import { RUN_STEPS } from "../data";
import { Reveal } from "../hooks";
import { CopyBtn, SectionHead } from "../ui";

export function Runbook() {
  return (
    <section className="border-t border-edge/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          kicker="// STEP 2 — EXECUTION & VERIFICATION"
          title="From empty directory to proven rejections"
          blurb="Six steps, all terminal. Steps 1–4 get a green 200; step 5 is where the prototype earns its keep — every attack vector must bounce with the right status code."
        />

        <ol className="relative mt-12 space-y-10 before:absolute before:bottom-6 before:left-[15px] before:top-2 before:w-px before:bg-edge sm:space-y-12 sm:before:left-[19px]">
          {RUN_STEPS.map((step, i) => (
            <Reveal as="li" key={step.n} delay={(i % 3) * 80} className="relative pl-12 sm:pl-16">
              <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg border border-teal/40 bg-deep font-mono text-[12px] font-bold text-teal sm:h-10 sm:w-10 sm:text-[13px]">
                {step.n}
              </span>
              <h3 className="pt-1 font-display text-xl font-semibold tracking-tight text-ink sm:text-[22px]">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-dim">{step.desc}</p>

              <div className="mt-4 overflow-hidden rounded-xl border border-edge bg-base">
                {step.blocks.map((b, j) => (
                  <div key={j}>
                    {b.cmd && (
                      <div className="group flex items-center gap-3 px-4 py-2.5">
                        <span className="select-none font-mono text-[12px] text-teal">$</span>
                        <code className="term-scroll min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[12.5px] text-ink">
                          {b.cmd}
                        </code>
                        <CopyBtn text={b.cmd} className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100" />
                      </div>
                    )}
                    {b.out && (
                      <div className="border-t border-edge/60 bg-deep px-4 py-2.5">
                        {b.out.map((line, k) => (
                          <p
                            key={k}
                            className={`break-all font-mono text-[12px] leading-relaxed ${
                              line.startsWith("HTTP/1.1 2")
                                ? "text-teal"
                                : line.startsWith("HTTP/1.1 4")
                                ? "text-rose"
                                : "text-dim"
                            }`}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
