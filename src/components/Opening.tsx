import { useCallback, useEffect, useState } from "react";
import { BENCH_BODY, BENCH_SECRET, SPRINT } from "../data";
import { Reveal } from "../hooks";
import { hmacHex, uid } from "../lib";
import { Chip, CopyBtn } from "../ui";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function TimeboxBar() {
  const pct = (SPRINT.actualHours / SPRINT.targetHours) * 100;
  const [width, setWidth] = useState(0);
  const ref = { current: null as HTMLDivElement | null };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            window.setTimeout(() => setWidth(pct), 250);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pct]);

  return (
    <div ref={ref} className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[11px] tracking-[0.14em] text-faint">
          TIME-BOX {SPRINT.targetHours.toFixed(1)}H
        </p>
        <p className="font-mono text-[11px] tracking-[0.14em] text-teal">
          ACTUAL {SPRINT.actualHours.toFixed(1)}H · 0.5H UNDER
        </p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-edge bg-deep">
        <div
          className="bar-live h-full rounded-full bg-gradient-to-r from-teal/80 to-teal transition-[width] duration-[1400ms] ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function SignatureAnatomy() {
  const [ts, setTs] = useState(() => Date.now());
  const [nonce, setNonce] = useState(() => uid());
  const [digest, setDigest] = useState("…");
  const [real, setReal] = useState(true);
  const [busy, setBusy] = useState(false);

  const sign = useCallback(async (t: number, n: string) => {
    setBusy(true);
    const { hex, real: r } = await hmacHex(
      BENCH_SECRET,
      [t, n, BENCH_BODY].join(".")
    );
    setDigest(hex);
    setReal(r);
    setBusy(false);
  }, []);

  useEffect(() => {
    void sign(ts, nonce);
  }, [ts, nonce, sign]);

  const resign = () => {
    setTs(Date.now());
    setNonce(uid());
  };

  return (
    <Reveal delay={140} className="h-full">
      <div className="panel-hover flex h-full flex-col rounded-xl border border-edge bg-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-[0.16em] text-faint">
            ANATOMY OF A SIGNED REQUEST
          </p>
          <button
            onClick={resign}
            className="inline-flex items-center gap-1.5 rounded-md border border-teal/40 bg-teal/10 px-3 py-1.5 font-mono text-[11px] text-teal transition-all hover:bg-teal/20 active:scale-[0.96]"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
              className={busy ? "animate-spin" : ""}
            >
              <path
                d="M10.5 6a4.5 4.5 0 1 1-1.32-3.18M10.5 1v2.2H8.3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            re-sign
          </button>
        </div>

        {/* canonical base */}
        <div
          key={digest}
          className="pop mt-5 rounded-lg border border-edge bg-deep p-4 font-mono text-[12px] leading-relaxed"
        >
          <p className="text-faint">signing base</p>
          <p className="mt-1.5 break-all">
            <span className="rounded bg-amber/10 px-1 py-0.5 text-amber">{ts}</span>
            <span className="text-faint"> . </span>
            <span className="rounded bg-sky/10 px-1 py-0.5 text-sky">{nonce}</span>
            <span className="text-faint"> . </span>
            <span className="rounded bg-teal/10 px-1 py-0.5 text-teal">
              {"{…raw body…}"}
            </span>
          </p>
          <div className="my-3 flex items-center gap-2 text-faint">
            <span className="h-px flex-1 bg-edge" />
            <span className="text-[10.5px] tracking-[0.14em]">
              HMAC-SHA256 · shared secret
            </span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M6 1.5v9m0 0L2.8 7.3M6 10.5l3.2-3.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="h-px flex-1 bg-edge" />
          </div>
          <p className="text-faint">
            X-NS-Signature:{" "}
            <span className="text-ink">sha256=</span>
            <span className="break-all text-teal">{digest}</span>
          </p>
          {!real && (
            <p className="mt-2 text-[10.5px] text-amber">
              demo digest — WebCrypto unavailable in this context
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CopyBtn text={`sha256=${digest}`} label="copy signature" />
          <span className="font-mono text-[10.5px] text-faint">
            64 hex chars · recomputed with real WebCrypto on every re-sign
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-edge pt-4 text-center">
          {[
            ["X-NS-Timestamp", "freshness · ±5 min", "text-amber"],
            ["X-NS-Nonce", "single-use id", "text-sky"],
            ["X-NS-Signature", "HMAC over raw bytes", "text-teal"],
          ].map(([h, d, c]) => (
            <div key={h} className="rounded-lg border border-edge bg-deep px-2 py-2.5">
              <dt className={`font-mono text-[10px] font-semibold ${c}`}>{h}</dt>
              <dd className="mt-1 text-[10.5px] leading-snug text-faint">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}

export function TopBar() {
  const now = useNow();
  return (
    <header className="sticky top-0 z-40 border-b border-edge/80 bg-base/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-[17px] font-bold tracking-tight text-ink">
            MERIDIAN
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight text-teal">
            PIVOT
          </span>
        </a>
        <span className="hidden rounded border border-edge bg-panel px-2 py-0.5 font-mono text-[10.5px] text-dim sm:inline">
          SOLO RECON
        </span>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <span className="hidden font-mono text-[11px] text-faint md:inline">
            {now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ·{" "}
            <span className="tabular-nums text-dim">
              {now.toLocaleTimeString("en-GB", { hour12: false })}
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-3 py-1 font-mono text-[10.5px] font-semibold text-lime">
            <i className="led h-1.5 w-1.5 rounded-full bg-lime" />
            PROTOTYPE {SPRINT.status}
          </span>
        </div>
      </div>
    </header>
  );
}

export function Opening() {
  return (
    <section id="top" className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="font-mono text-xs font-medium tracking-[0.18em] text-amber">
              {"// MERIDIAN PIVOT · ASSIGNMENT 01 · DAYS 1–2"}
            </p>
            <h1 className="mt-5 font-display text-[42px] font-bold leading-[1.02] tracking-tight text-ink sm:text-[64px]">
              Webhook Signature
              <br />
              Verification<span className="text-teal">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-dim">
              {SPRINT.purpose} This is the Day 1–2 mini-prototype: a
              self-contained Express service that accepts inventory updates{" "}
              <em className="text-ink not-italic font-semibold">
                only when they carry an HMAC-SHA256 signature over the raw bytes
              </em>{" "}
              — with a 5-minute freshness window and single-use nonces against
              replays.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-7 flex flex-wrap gap-2">
              <Chip tone="teal">{SPRINT.tool}</Chip>
              <Chip>{SPRINT.company}</Chip>
              <Chip>Node 20 · Express 4</Chip>
              <Chip>node:crypto</Chip>
              <Chip tone="sky">replay guard</Chip>
              <Chip tone="amber">no outside help</Chip>
            </div>
            <TimeboxBar />
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <SignatureAnatomy />
        </div>
      </div>
    </section>
  );
}
