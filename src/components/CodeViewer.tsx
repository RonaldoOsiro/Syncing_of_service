import { useState } from "react";
import { FILES } from "../data";
import { Reveal } from "../hooks";
import { highlightLine } from "../highlight";
import { CopyBtn, SectionHead } from "../ui";

function CodePane({ fileIndex }: { fileIndex: number }) {
  const file = FILES[fileIndex];
  const lines = file.code.replace(/\n$/, "").split("\n");

  return (
    <div className="term-scroll max-h-[560px] overflow-auto">
      <pre className="min-w-max px-0 py-4 font-mono text-[12.5px] leading-[1.75]">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-panel2/40">
            <span className="w-12 shrink-0 select-none pr-4 text-right text-[11px] leading-[1.95] text-faint/70">
              {i + 1}
            </span>
            <code className="pr-6 whitespace-pre">
              {highlightLine(line, file.lang).map((tok, j) =>
                tok.cls ? (
                  <span key={j} className={tok.cls}>
                    {tok.text}
                  </span>
                ) : (
                  <span key={j}>{tok.text}</span>
                )
              )}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function Codebase() {
  const [active, setActive] = useState(0);
  const file = FILES[active];

  return (
    <section className="border-t border-edge/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          kicker="// STEP 1 — MINI-PROTOTYPE CODEBASE"
          title="Four files, zero external services"
          blurb={
            <>
              The whole prototype is <span className="text-ink">server.js</span> — Express plus{" "}
              <span className="text-ink">node:crypto</span>, nothing else.{" "}
              <span className="text-ink">send.sh</span> plays the supplier: it builds the canonical
              signing base and HMACs it with openssl exactly the way a real warehouse integration
              would. Inline comments mark where each blocker changed the code.
            </>
          }
        />

        <Reveal delay={120} className="mt-9">
          <div className="overflow-hidden rounded-xl border border-edge bg-deep shadow-[0_30px_70px_-30px_rgba(2,8,20,0.9)]">
            {/* tab strip */}
            <div className="term-scroll flex items-center gap-1 overflow-x-auto border-b border-edge bg-panel px-2 pt-2">
              {FILES.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setActive(i)}
                  className={`relative shrink-0 rounded-t-md px-3.5 py-2 font-mono text-[12px] transition-colors ${
                    i === active
                      ? "bg-deep text-teal"
                      : "text-faint hover:bg-panel2/60 hover:text-dim"
                  }`}
                >
                  {f.name}
                  {i === active && (
                    <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-teal" />
                  )}
                </button>
              ))}
              <span className="ml-auto hidden shrink-0 items-center gap-3 pb-1 pl-4 sm:flex">
                <span className="font-mono text-[10.5px] text-faint">{file.note}</span>
                <CopyBtn text={file.code} label={"copy " + file.name} />
              </span>
            </div>

            <CodePane key={file.name} fileIndex={active} />

            <div className="flex flex-wrap items-center gap-3 border-t border-edge bg-panel px-4 py-2.5">
              <span className="font-mono text-[10.5px] text-faint sm:hidden">{file.note}</span>
              <span className="ml-auto font-mono text-[10.5px] text-faint">
                {file.code.split("\n").length - 1} lines · {file.lang === "sh" ? "shell" : file.lang}
              </span>
              <CopyBtn text={file.code} label="copy file" className="sm:hidden" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={200} className="mt-5">
          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border border-edge/70 bg-panel/60 px-4 py-3 font-mono text-[11.5px] text-faint">
            <span>
              <span className="text-teal">✓</span> syntactically valid & runnable as-is
            </span>
            <span>
              <span className="text-teal">✓</span> HMAC over raw bytes, never re-stringified
            </span>
            <span>
              <span className="text-teal">✓</span> constant-time compare, throw-proof
            </span>
            <span>
              <span className="text-teal">✓</span> freshness window + single-use nonces
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
