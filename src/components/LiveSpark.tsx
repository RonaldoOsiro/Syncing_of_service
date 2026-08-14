import { useEffect, useRef, useState } from "react";

const WINDOW = 24;

function seed(): number[] {
  const out: number[] = [];
  for (let i = 0; i < WINDOW; i++) out.push(4 + Math.floor(Math.random() * 6));
  return out;
}

/** A miniature, actually-running echo of the snippet's liveTick() feed. */
export function LiveSpark() {
  const [series, setSeries] = useState<number[]>(seed);
  const [paused, setPaused] = useState(false);
  const [ticks, setTicks] = useState(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setSeries((s) => {
        const next = [...s, 4 + Math.floor(Math.random() * 7)];
        if (next.length > WINDOW) next.shift();
        return next;
      });
      setTicks((t) => t + 1);
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  const W = 292;
  const H = 74;
  const L = 4;
  const R = 10;
  const T = 8;
  const B = 8;
  const max = Math.max(10, ...series);
  const x = (i: number) => L + (i * (W - L - R)) / (WINDOW - 1);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);

  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area =
    `M${L},${H - B} ` +
    series.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ") +
    ` L${(W - R).toFixed(1)},${H - B} Z`;
  const lastX = x(series.length - 1);
  const lastY = y(series[series.length - 1]);
  const now = series[series.length - 1];

  return (
    <div className="panel-hover rounded-xl border border-edge bg-panel p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <i
              className={`pulse-ring absolute inline-flex h-2 w-2 rounded-full ${
                paused ? "bg-faint" : "bg-teal"
              }`}
            />
            <i
              className={`relative inline-flex h-2 w-2 rounded-full ${
                paused ? "bg-faint" : "bg-teal"
              }`}
            />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-dim">
            live feed · echo
          </span>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className={`rounded border px-2 py-0.5 font-mono text-[10px] transition-colors active:scale-95 ${
            paused
              ? "border-amber/60 text-amber hover:bg-amber/10"
              : "border-edge text-faint hover:border-teal/60 hover:text-teal"
          }`}
        >
          {paused ? "▶ resume" : "⏸ pause"}
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="tabular font-display text-3xl font-bold text-teal">
            {now}
          </div>
          <div className="font-mono text-[10px] text-faint">
            deflected / tick
          </div>
        </div>
        <div className="text-right font-mono text-[10px] leading-relaxed text-faint">
          <div>
            window <span className="text-dim">{WINDOW} pts</span>
          </div>
          <div>
            ticks <span className="tabular text-dim">{ticks}</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full"
        role="img"
        aria-label="Rolling sparkline of deflected events"
      >
        <path d={area} fill="rgba(52,211,176,0.12)" />
        <polyline
          points={pts}
          fill="none"
          stroke="#34d3b0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastX} cy={lastY} r="3.5" fill="#34d3b0" />
        <circle cx={lastX} cy={lastY} r="3.5" fill="#34d3b0" className="pulse-ring" />
      </svg>

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
        A tiny replica of <span className="text-teal">liveTick()</span> — the
        real one fires every 5s inside the snippet.
      </p>
    </div>
  );
}
