import { COMMIT, DIFFSTAT, fullMessage } from "../data";
import { useCopy, useTypewriter } from "../hooks";

export function CopyButton({
  text,
  label = "Copy message",
  compact = false,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      className={`inline-flex items-center gap-2 rounded-md border font-mono transition-all duration-200 active:scale-[0.97] ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
      } ${
        copied
          ? "border-lime/60 bg-lime/10 text-lime"
          : "border-edge bg-panel text-dim hover:border-amber/60 hover:text-amber"
      }`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6.4 4.7 9 10 3.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="3.5"
              y="3.5"
              width="7"
              height="7"
              rx="1.4"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M8.5 3.5v-.6A1.4 1.4 0 0 0 7.1 1.5H2.9a1.4 1.4 0 0 0-1.4 1.4v4.2a1.4 1.4 0 0 0 1.4 1.4h.6"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export function Terminal() {
  const { typed, done } = useTypewriter(COMMIT.subject, 24, 700);
  const { copied: shaCopied, copy: copySha } = useCopy(1400);
  const stat = `${DIFFSTAT.files}, ${DIFFSTAT.added} insertions(+), ${DIFFSTAT.removed} deletions(-)`;

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-deep shadow-[0_30px_80px_-20px_rgba(2,8,23,0.9)]">
      {/* chrome */}
      <div className="flex items-center gap-3 border-b border-edge bg-panel px-4 py-2.5">
        <span className="flex gap-1.5">
          <i className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <i className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <i className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate font-mono text-[11px] text-faint">
          git commit — {COMMIT.branch}
        </span>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 font-mono text-[11px] text-faint sm:flex">
          <i className="blink-dot h-1.5 w-1.5 rounded-full bg-lime" />
          staged
        </span>
      </div>

      {/* body */}
      <div className="term-scroll max-h-[600px] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        <p className="font-mono text-xs text-faint">
          $ git commit <span className="text-dim"># {stat}</span>
        </p>

        {/* subject, typed live */}
        <h2 className="mt-4 min-h-[2.5em] font-display text-xl leading-snug text-ink sm:text-[26px]">
          <span className="font-bold">{typed}</span>
          {!done && <span className="caret" />}
        </h2>

        {/* body fades in once the subject lands */}
        <div
          className={`mt-5 transition-all duration-700 ${
            done ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-dim">
            {COMMIT.body}
          </pre>

          <div className="mt-6 border-t border-edge pt-4 font-mono text-[11px] leading-relaxed text-faint">
            <p>
              # Author: <span className="text-dim">{COMMIT.author}</span>
            </p>
            <p>
              # Date: <span className="text-dim">{COMMIT.date}</span>
            </p>
            <p>
              # On branch <span className="text-sky">{COMMIT.branch}</span>
              <span> ← </span>
              <span className="text-dim">{COMMIT.base}</span>
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CopyButton text={fullMessage} />
            <button
              onClick={() => copySha(COMMIT.sha)}
              className="inline-flex items-center gap-2 rounded-md border border-edge bg-panel2 px-3.5 py-1.5 font-mono text-xs text-sky transition-colors hover:border-sky/60 active:scale-[0.97]"
              title="Copy commit SHA"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="3" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="9" cy="2.6" r="1.7" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="9" cy="9.4" r="1.7" stroke="currentColor" strokeWidth="1.3" />
                <path
                  d="M4.6 5.4 7.4 3.2M4.6 6.6l2.8 2.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
              {shaCopied ? "copied!" : COMMIT.sha}
            </button>
            <span className="font-mono text-[11px] text-faint">{stat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
