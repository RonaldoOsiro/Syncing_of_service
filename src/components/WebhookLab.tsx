import { useRef, useState } from "react";
import { BENCH_BODY, BENCH_SECRET, BENCH_TAMPERED } from "../data";
import { Reveal } from "../hooks";
import { clockTime, hmacHex, sleep, uid } from "../lib";
import { SectionHead } from "../ui";

type ScenarioId = "valid" | "tampered" | "stale" | "replay";

type CheckState = "pending" | "ok" | "fail" | "skip";
type Check = { name: string; detail: string; state: CheckState };

type Response = {
  status: number;
  reason: string;
  body: string;
  tone: "teal" | "rose" | "amber";
};

type LogLine = { time: string; text: string; tone: "ok" | "err" | "warn" | "info" };

const SCENARIOS: {
  id: ScenarioId;
  code: string;
  title: string;
  desc: string;
  tone: "teal" | "rose" | "amber";
}[] = [
  {
    id: "valid",
    code: "200",
    title: "Happy path",
    desc: "Fresh timestamp, new nonce, body untouched.",
    tone: "teal",
  },
  {
    id: "tampered",
    code: "401",
    title: "Tampered body",
    desc: "Signed pre-interception; stock altered in transit.",
    tone: "rose",
  },
  {
    id: "stale",
    code: "400",
    title: "Stale timestamp",
    desc: "Signed 6 minutes ago — outside the ±5 min window.",
    tone: "amber",
  },
  {
    id: "replay",
    code: "409",
    title: "Replayed nonce",
    desc: "The same signed request, sent twice in a row.",
    tone: "amber",
  },
];

const CHECK_NAMES = ["raw body captured", "timestamp in window", "nonce not seen", "HMAC matches"];

const toneText: Record<string, string> = {
  teal: "text-teal",
  rose: "text-rose",
  amber: "text-amber",
};
const toneBorder: Record<string, string> = {
  teal: "border-teal/50",
  rose: "border-rose/50",
  amber: "border-amber/50",
};

export function WebhookLab() {
  const [scenario, setScenario] = useState<ScenarioId>("valid");
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [resp, setResp] = useState<Response | null>(null);
  const [reqHeaders, setReqHeaders] = useState<{ ts: string; nonce: string; sig: string } | null>(null);
  const [sentBody, setSentBody] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [store, setStore] = useState({ stock: 96, updatedAt: "—", source: "seed", flash: 0 });
  const seenNonces = useRef<Set<string>>(new Set());
  const realDigest = useRef(true);

  const appendLog = (line: Omit<LogLine, "time">) =>
    setLog((l) => [...l.slice(-7), { time: clockTime(), ...line }]);

  /* One pass through the verify pipeline, faithfully ported from
     server.js. Returns the verdict; reveals checks progressively. */
  const sendOnce = async (spec: {
    ts: number;
    nonce: string;
    signedBody: string;
    sentBody: string;
    tag: string;
  }): Promise<void> => {
    const { ts, nonce, signedBody, sentBody: sent, tag } = spec;

    const { hex: senderSig, real } = await hmacHex(
      BENCH_SECRET,
      [ts, nonce, signedBody].join(".")
    );
    realDigest.current = real;
    setReqHeaders({ ts: String(ts), nonce, sig: "sha256=" + senderSig });
    setSentBody(sent);
    setResp(null);

    const mk = (): Check[] =>
      CHECK_NAMES.map((name) => ({ name, detail: "waiting…", state: "pending" as CheckState }));
    const cks = mk();
    setChecks([...cks]);

    const setCheck = (i: number, state: CheckState, detail: string) => {
      cks[i] = { ...cks[i], state, detail };
      setChecks([...cks]);
    };
    const skipRest = (from: number) => {
      for (let i = from; i < cks.length; i++)
        cks[i] = { ...cks[i], state: "skip", detail: "not evaluated" };
      setChecks([...cks]);
    };

    // check 0 — raw body captured (always passes in this bench)
    await sleep(360);
    setCheck(0, "ok", sent.length + " bytes stashed by express.json verify()");

    // check 1 — freshness window
    await sleep(420);
    const age = Math.abs(Date.now() - ts);
    if (!Number.isFinite(age) || age > 5 * 60 * 1000) {
      setCheck(1, "fail", "age " + Math.round(age / 60000) + " min > 5 min window");
      skipRest(2);
      await sleep(320);
      const r: Response = {
        status: 400,
        reason: "timestamp outside window",
        body: '{"error":"timestamp outside window"}',
        tone: "amber",
      };
      setResp(r);
      appendLog({ text: tag + " → 400 timestamp outside window", tone: "warn" });
      return;
    }
    setCheck(1, "ok", "age " + Math.max(0, Math.round(age / 1000)) + "s ≤ 300s");

    // check 2 — replay guard
    await sleep(420);
    if (seenNonces.current.has(nonce)) {
      setCheck(2, "fail", "nonce consumed on a previous request");
      skipRest(3);
      await sleep(320);
      setResp({
        status: 409,
        reason: "nonce already seen",
        body: '{"error":"nonce already seen"}',
        tone: "amber",
      });
      appendLog({ text: tag + " → 409 nonce already seen", tone: "warn" });
      return;
    }
    setCheck(2, "ok", "first time this nonce appears");

    // check 3 — HMAC over the RECEIVED bytes
    await sleep(520);
    const { hex: serverSig } = await hmacHex(BENCH_SECRET, [ts, nonce, sent].join("."));
    if (senderSig !== serverSig) {
      setCheck(3, "fail", "expected " + serverSig.slice(0, 10) + "… got " + senderSig.slice(0, 10) + "…");
      await sleep(320);
      setResp({
        status: 401,
        reason: "invalid signature",
        body: '{"error":"invalid signature"}',
        tone: "rose",
      });
      appendLog({ text: tag + " → 401 invalid signature", tone: "err" });
      return;
    }
    setCheck(3, "ok", "constant-time compare over 64 hex chars");

    // all green → consume nonce, apply to store
    seenNonces.current.add(nonce);
    await sleep(300);
    setResp({
      status: 200,
      reason: "accepted & applied",
      body: '{"ok":true,"received":"stock.updated","sku":"NS-1042","stock":118}',
      tone: "teal",
    });
    setStore((s) => ({
      stock: 118,
      updatedAt: new Date().toISOString().slice(11, 19) + "Z",
      source: "webhook:verified",
      flash: s.flash + 1,
    }));
    appendLog({ text: tag + " → 200 stock.updated NS-1042 → 118", tone: "ok" });
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (scenario === "replay") {
        const nonce = uid() + "-rp";
        const ts = Date.now();
        await sendOnce({ ts, nonce, signedBody: BENCH_BODY, sentBody: BENCH_BODY, tag: "req #1 (signed)" });
        await sleep(900);
        appendLog({ text: "— identical request re-sent (same headers, same body) —", tone: "info" });
        await sleep(500);
        await sendOnce({ ts, nonce, signedBody: BENCH_BODY, sentBody: BENCH_BODY, tag: "req #2 (replay)" });
      } else if (scenario === "tampered") {
        await sendOnce({
          ts: Date.now(),
          nonce: uid(),
          signedBody: BENCH_BODY,
          sentBody: BENCH_TAMPERED,
          tag: "POST /webhooks/inventory",
        });
      } else if (scenario === "stale") {
        const ts = Date.now() - 6 * 60 * 1000;
        await sendOnce({ ts, nonce: uid(), signedBody: BENCH_BODY, sentBody: BENCH_BODY, tag: "POST /webhooks/inventory" });
      } else {
        await sendOnce({
          ts: Date.now(),
          nonce: uid(),
          signedBody: BENCH_BODY,
          sentBody: BENCH_BODY,
          tag: "POST /webhooks/inventory",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const checkGlyph = (s: CheckState) =>
    s === "ok" ? "✓" : s === "fail" ? "✕" : s === "skip" ? "—" : "·";
  const checkCls = (s: CheckState) =>
    s === "ok"
      ? "border-teal/45 bg-teal/8 text-teal"
      : s === "fail"
      ? "border-rose/45 bg-rose/8 text-rose"
      : s === "skip"
      ? "border-edge bg-deep text-faint"
      : "border-edge bg-deep text-faint";

  return (
    <section className="relative border-t border-edge/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          kicker="// LIVE BENCH — TRY TO BREAK IT"
          title="The verify pipeline, running live"
          blurb={
            <>
              The exact decision logic from <code className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-[12.5px] text-teal">verifyWebhook()</code>{" "}
              ported to your browser — real HMAC-SHA256 via WebCrypto, real timing checks, and a
              nonce cache that persists while you play. Pick an attack, send the request, watch the
              middleware think.
            </>
          }
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {/* left column — scenarios + store */}
          <div className="space-y-5 lg:col-span-4">
            <Reveal delay={80}>
              <div className="rounded-xl border border-edge bg-panel p-4">
                <p className="px-1 font-mono text-[11px] tracking-[0.16em] text-faint">
                  CHOOSE AN ATTACK
                </p>
                <div className="mt-3 space-y-2">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => !busy && setScenario(s.id)}
                      className={`group w-full rounded-lg border p-3 text-left transition-all duration-200 active:scale-[0.985] ${
                        scenario === s.id
                          ? `${toneBorder[s.tone]} bg-panel2`
                          : "border-edge bg-deep hover:border-edge2"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-11 shrink-0 rounded-md border px-1 py-1 text-center font-mono text-[11.5px] font-bold ${toneBorder[s.tone]} ${toneText[s.tone]}`}
                        >
                          {s.code}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-[14.5px] font-semibold text-ink">
                            {s.title}
                          </span>
                          <span className="block text-[12px] leading-snug text-faint">
                            {s.desc}
                          </span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={run}
                  disabled={busy}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-display text-[15px] font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${
                    busy
                      ? "cursor-wait border border-edge bg-deep text-faint"
                      : "border border-teal/60 bg-teal/15 text-teal hover:bg-teal/25"
                  }`}
                >
                  {busy ? (
                    <>
                      <i className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-faint border-t-transparent" />
                      verifying…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 1.8 10.4 6 2 10.2V1.8Z" fill="currentColor" />
                      </svg>
                      send signed request
                    </>
                  )}
                </button>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="rounded-xl border border-edge bg-panel p-4">
                <div className="flex items-center justify-between px-1">
                  <p className="font-mono text-[11px] tracking-[0.16em] text-faint">
                    IN-MEMORY STORE
                  </p>
                  <span className="font-mono text-[10.5px] text-faint">GET /inventory/NS-1042</span>
                </div>
                <div key={store.flash} className={store.flash ? "stock-flash mt-2 rounded-lg px-2 py-1" : "mt-2"}>
                  <dl className="divide-y divide-edge/70 font-mono text-[12px]">
                    {[
                      ["sku", "NS-1042", "text-ink"],
                      ["stock", String(store.stock), store.stock === 118 ? "text-teal" : "text-dim"],
                      ["updatedAt", store.updatedAt, "text-dim"],
                      ["source", store.source, store.source === "webhook:verified" ? "text-teal" : "text-faint"],
                    ].map(([k, v, c]) => (
                      <div key={k} className="flex items-baseline justify-between py-1.5">
                        <dt className="text-faint">{k}</dt>
                        <dd className={`break-all pl-3 text-right ${c}`}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="mt-2 px-1 text-[11px] leading-snug text-faint">
                  Seeded at 96. Only a <span className="text-teal">200</span> moves it — provenance included.
                </p>
              </div>
            </Reveal>
          </div>

          {/* right column — request / checks / response / log */}
          <div className="space-y-5 lg:col-span-8">
            <Reveal delay={120}>
              <div className="overflow-hidden rounded-xl border border-edge bg-deep">
                <div className="flex items-center gap-3 border-b border-edge bg-panel px-4 py-2.5">
                  <span className="rounded bg-teal/15 px-2 py-0.5 font-mono text-[11px] font-bold text-teal">
                    POST
                  </span>
                  <span className="truncate font-mono text-[12px] text-dim">
                    /webhooks/inventory
                  </span>
                  <span className="ml-auto hidden font-mono text-[10.5px] text-faint sm:block">
                    {!realDigest.current && reqHeaders ? "demo digest (WebCrypto unavailable)" : "HMAC-SHA256 · hex"}
                  </span>
                </div>
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="border-b border-edge/70 p-4 font-mono text-[11.5px] leading-relaxed md:border-b-0 md:border-r">
                    <p className="text-[10.5px] tracking-[0.16em] text-faint">HEADERS</p>
                    <div className="mt-2 space-y-1.5">
                      {reqHeaders ? (
                        <>
                          <p>
                            <span className="text-amber">X-NS-Timestamp</span>
                            <span className="text-faint">: </span>
                            <span className="text-ink">{reqHeaders.ts}</span>
                          </p>
                          <p>
                            <span className="text-sky">X-NS-Nonce</span>
                            <span className="text-faint">: </span>
                            <span className="text-ink">{reqHeaders.nonce}</span>
                          </p>
                          <p>
                            <span className="text-teal">X-NS-Signature</span>
                            <span className="text-faint">: </span>
                            <span className="break-all text-teal">{reqHeaders.sig}</span>
                          </p>
                        </>
                      ) : (
                        <p className="text-faint">— send a request to see headers —</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 font-mono text-[11.5px] leading-relaxed">
                    <p className="text-[10.5px] tracking-[0.16em] text-faint">RAW BODY (signed bytes)</p>
                    {sentBody ? (
                      <p
                        className={`mt-2 break-all rounded-lg border p-2.5 ${
                          sentBody !== BENCH_BODY ? "border-rose/40 bg-rose/5 text-rose" : "border-edge bg-panel text-dim"
                        }`}
                      >
                        {sentBody}
                        {sentBody !== BENCH_BODY && (
                          <span className="mt-1.5 block text-[10.5px] text-rose/80">
                            ⚠ stock field altered after signing
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-2 text-faint">— nothing sent yet —</p>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* checks + response */}
            <Reveal delay={160}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-edge bg-panel p-4">
                  <p className="px-1 font-mono text-[11px] tracking-[0.16em] text-faint">
                    VERIFY PIPELINE
                  </p>
                  <ol className="mt-3 space-y-2">
                    {(checks.length ? checks : CHECK_NAMES.map((name) => ({ name, detail: "idle", state: "pending" as CheckState }))).map((c, i) => (
                      <li
                        key={c.name}
                        className={`rounded-lg border px-3 py-2 transition-all duration-300 ${checkCls(c.state)}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-4 text-center font-mono text-[13px] font-bold">
                            {checkGlyph(c.state)}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-mono text-[12px] font-semibold">
                              {i + 1}. {c.name}
                            </span>
                            <span className="block truncate font-mono text-[10.5px] opacity-75">
                              {c.detail}
                            </span>
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col rounded-xl border border-edge bg-panel p-4">
                  <p className="px-1 font-mono text-[11px] tracking-[0.16em] text-faint">
                    SERVER RESPONSE
                  </p>
                  {resp ? (
                    <div key={resp.status + resp.reason + log.length} className="pop mt-3 flex flex-1 flex-col">
                      <p className={`font-display text-[44px] font-bold leading-none ${toneText[resp.tone]}`}>
                        {resp.status}
                      </p>
                      <p className="mt-1 font-mono text-[12px] text-dim">{resp.reason}</p>
                      <pre
                        className={`mt-4 flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded-lg border p-3 font-mono text-[11.5px] leading-relaxed ${toneBorder[resp.tone]} bg-deep ${toneText[resp.tone]}`}
                      >
                        {resp.body}
                      </pre>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-1 flex-col items-start justify-center gap-2">
                      <p className="font-mono text-[12px] text-faint">
                        {busy ? "middleware is working…" : "response lands here"}
                      </p>
                      {busy && <span className="caret" />}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>

            {/* request log */}
            <Reveal delay={200}>
              <div className="term-scroll max-h-56 overflow-y-auto rounded-xl border border-edge bg-base p-4">
                <p className="font-mono text-[10.5px] tracking-[0.16em] text-faint">
                  REQUEST LOG — {log.length} {log.length === 1 ? "ENTRY" : "ENTRIES"}
                </p>
                <div className="mt-2 space-y-1">
                  {log.length === 0 ? (
                    <p className="font-mono text-[12px] text-faint">
                      <span className="text-teal">▸</span> webhook hot — waiting for first delivery…
                    </p>
                  ) : (
                    log.map((l, i) => (
                      <p key={i} className="pop font-mono text-[12px] leading-relaxed">
                        <span className="text-faint">{l.time}</span>{" "}
                        <span
                          className={
                            l.tone === "ok"
                              ? "text-teal"
                              : l.tone === "err"
                              ? "text-rose"
                              : l.tone === "warn"
                              ? "text-amber"
                              : "text-dim"
                          }
                        >
                          {l.text}
                        </span>
                      </p>
                    ))
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
