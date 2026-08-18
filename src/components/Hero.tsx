import { useEffect, useRef, useState } from "react";
import { makeStreamEvent, PARTNERS, STATS, type StreamEvent } from "../data";
import { Reveal, useCountUp } from "../hooks";

/* ---------- live delivery stream ---------- */

const STATUS_META: Record<StreamEvent["status"], { cls: string; label: string }> = {
  200: { cls: "bg-greensoft text-green border-green/25", label: "200 OK" },
  400: { cls: "bg-ambersoft text-amber border-amber/25", label: "400" },
  401: { cls: "bg-rosesoft text-rose border-rose/25", label: "401" },
  409: { cls: "bg-rosesoft text-rose border-rose/25", label: "409" },
};

function DeliveryStream() {
  const [events, setEvents] = useState<StreamEvent[]>(() => [
    makeStreamEvent(),
    makeStreamEvent(),
    makeStreamEvent(),
  ]);
  const [paused, setPaused] = useState(false);
  const [lastAccepted, setLastAccepted] = useState<StreamEvent | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const t = window.setInterval(() => {
      if (pausedRef.current) return;
      const ev = makeStreamEvent();
      setEvents((prev) => [ev, ...prev].slice(0, 6));
      if (ev.status === 200) setLastAccepted(ev);
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="lift flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-card shadow-[0_30px_70px_-30px_rgba(13,27,46,0.35)]"
    >
      <div className="flex items-center gap-3 border-b border-edge px-5 py-3.5">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-[#e8c37e]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#7fb4ff]" />
          <i className="h-2.5 w-2.5 rounded-full bg-tealbr" />
        </span>
        <p className="font-mono text-[11.5px] font-medium text-slate">
          /webhooks/inventory · delivery stream
        </p>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
            paused ? "border-amber/30 bg-ambersoft text-amber" : "border-green/25 bg-greensoft text-green"
          }`}
        >
          <i className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-amber" : "led-green bg-green"}`} />
          {paused ? "paused · hover off" : "streaming"}
        </span>
      </div>

      <div className="flex-1 space-y-2 px-4 py-4">
        {events.map((ev) => {
          const meta = STATUS_META[ev.status];
          return (
            <div
              key={ev.id}
              className="pop flex items-center gap-3 rounded-lg border border-edge/80 bg-paper px-3 py-2"
            >
              <span className="font-mono text-[10.5px] tabular-nums text-faint">{ev.time}</span>
              <span className="rounded bg-ink px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-paper">
                POST
              </span>
              <span className="font-mono text-[11.5px] font-semibold text-ink">{ev.sku}</span>
              <span className="hidden font-mono text-[10.5px] text-faint sm:inline">
                sha256={ev.sig}…
              </span>
              <span className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${meta.cls}`}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-edge bg-paper/70 px-5 py-3">
        {lastAccepted ? (
          <p key={lastAccepted.id} className="stock-flash flex items-center gap-2 rounded-md px-2 py-1 font-mono text-[11.5px] text-slate">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M6 1.2 7.5 4.5 10.8 6 7.5 7.5 6 10.8 4.5 7.5 1.2 6 4.5 4.5Z" fill="#0d9488" />
            </svg>
            store updated — <span className="font-semibold text-ink">{lastAccepted.sku}</span>
            now <span className="font-semibold text-teal">{lastAccepted.stock}</span> units ·
            source: webhook:verified
          </p>
        ) : (
          <p className="px-2 py-1 font-mono text-[11.5px] text-faint">awaiting first verified delivery…</p>
        )}
      </div>
    </div>
  );
}

/* ---------- stat counter ---------- */

function Stat({ value, decimals, suffix, label }: (typeof STATS)[number]) {
  const { ref, display } = useCountUp(value, decimals);
  return (
    <div className="border-l-2 border-edge pl-4 transition-colors hover:border-teal">
      <p className="font-display text-[26px] font-bold leading-none tracking-tight text-ink">
        <span ref={ref}>{display}</span>
        <span className="text-teal">{suffix}</span>
      </p>
      <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">{label}</p>
    </div>
  );
}

/* ---------- partner marquee ---------- */

function Marquee() {
  const doubled = [...PARTNERS, ...PARTNERS];
  return (
    <div id="partners" className="marquee relative mt-20 overflow-hidden border-y border-edge bg-card/60 py-5">
      <div className="marquee-track items-center gap-14 pr-14">
        {doubled.map((p, i) => (
          <span key={`${p}-${i}`} className="flex shrink-0 items-center gap-2.5 opacity-70 transition-opacity hover:opacity-100">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <rect x="2.6" y="2.6" width="7.8" height="7.8" rx="1.6" transform="rotate(45 6.5 6.5)" stroke="#0d9488" strokeWidth="1.3" />
            </svg>
            <span className="font-display text-[17px] font-semibold tracking-tight text-slate">{p}</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-paper to-transparent" />
    </div>
  );
}

/* ---------- compass watermark ---------- */

function Compass() {
  return (
    <svg
      viewBox="0 0 600 600"
      className="spin-slow pointer-events-none absolute -right-40 -top-44 h-[640px] w-[640px] opacity-[0.06]"
      aria-hidden
    >
      <circle cx="300" cy="300" r="290" fill="none" stroke="#0d1b2e" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="210" fill="none" stroke="#0d1b2e" strokeWidth="1" strokeDasharray="4 8" />
      <circle cx="300" cy="300" r="120" fill="none" stroke="#0d1b2e" strokeWidth="1" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 24;
        const x1 = 300 + Math.cos(a) * 270;
        const y1 = 300 + Math.sin(a) * 270;
        const x2 = 300 + Math.cos(a) * 290;
        const y2 = 300 + Math.sin(a) * 290;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0d1b2e" strokeWidth="1.5" />;
      })}
      <path d="M300 60 340 300 300 540 260 300Z" fill="none" stroke="#0d1b2e" strokeWidth="1.5" />
      <path d="M60 300 300 260 540 300 300 340Z" fill="none" stroke="#0d1b2e" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- hero ---------- */

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <Compass />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-tealsoft/60 px-3.5 py-1.5 font-mono text-[11px] font-semibold text-teal">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 1.2 7.5 4.5 10.8 6 7.5 7.5 6 10.8 4.5 7.5 1.2 6 4.5 4.5Z" fill="currentColor" />
              </svg>
              INVENTORY WEBHOOK API · BUILT AT NORTHSTAR RETAIL CO.
            </p>
            <h1 className="mt-7 font-display text-[44px] font-bold leading-[1.02] tracking-tight text-ink sm:text-[68px]">
              Stock data you
              <br />
              can <span className="relative inline-block text-teal">prove<svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 120 10" fill="none" preserveAspectRatio="none" aria-hidden><path d="M2 7c30-5 60-5 116-3" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg></span>.
            </h1>
            <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-slate">
              Northstar Sync turns supplier webhooks into inventory your support team can
              quote verbatim — <strong className="font-semibold text-ink">HMAC-signed over the raw bytes</strong>,
              replay-proof by single-use nonce, and live in under a second.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#playground"
                className="rounded-lg bg-ink px-6 py-3 text-[14.5px] font-semibold text-paper shadow-[0_10px_30px_-10px_rgba(13,27,46,0.5)] transition-all hover:bg-teal active:scale-[0.97]"
              >
                Try the playground
              </a>
              <a
                href="#how"
                className="group inline-flex items-center gap-2 rounded-lg border border-edge2 bg-card px-6 py-3 text-[14.5px] font-semibold text-ink transition-all hover:border-teal/60 hover:text-teal active:scale-[0.97]"
              >
                See how it verifies
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  <path d="M2 6.5h8.5m0 0L7 3m3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <p className="mt-4 font-mono text-[11.5px] text-faint">
              no signup · runs locally in 4 commands ·{" "}
              <a href="#deploy" className="text-teal underline decoration-teal/40 underline-offset-4 hover:decoration-teal">
                deploy guide ↓
              </a>
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {STATS.map((s) => (
                <Stat key={s.label} {...s} />
              ))}
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={160} className="h-full">
            <DeliveryStream />
          </Reveal>
        </div>
      </div>

      <Marquee />
    </section>
  );
}
