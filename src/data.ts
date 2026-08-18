/* =============== Northstar Sync — site content =============== */

export const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Security", href: "#security" },
  { label: "Playground", href: "#playground" },
  { label: "Deploy", href: "#deploy" },
  { label: "Ship log", href: "#changelog" },
];

export const STATS = [
  { value: 99.98, decimals: 2, suffix: "%", label: "verified deliveries" },
  { value: 380, decimals: 0, suffix: "k", label: "events / day" },
  { value: 31, decimals: 0, suffix: "ms", label: "p50 verification" },
  { value: 0, decimals: 0, suffix: "", label: "replays accepted" },
];

export const PARTNERS = [
  "Shoply",
  "Vendora",
  "CartBase",
  "Stockpile",
  "Orderly",
  "Parcelio",
  "Restockd",
  "Kiosko",
];

export const PIPELINE_STEPS = [
  {
    n: "01",
    title: "Supplier signs",
    body: "Every update is HMAC-SHA256 signed over timestamp · nonce · raw body before it leaves the warehouse.",
    code: "signing base: ts.nonce.body",
  },
  {
    n: "02",
    title: "Webhook arrives",
    body: "POST /webhooks/inventory carrying three headers — timestamp, nonce, and the sha256= digest.",
    code: "X-NS-Signature: sha256=…",
  },
  {
    n: "03",
    title: "Northstar verifies",
    body: "Freshness window, single-use nonce, then a constant-time HMAC comparison against the exact received bytes.",
    code: "crypto.timingSafeEqual",
  },
  {
    n: "04",
    title: "Store updates",
    body: "Only verified events touch stock. The support desk reads provably-fresh numbers via the inventory API.",
    code: "GET /inventory/:sku",
  },
];

export const SECURITY_ROWS = [
  {
    id: "raw",
    title: "Signed over raw bytes, never objects",
    body: "express.json() replaces the body stream with a parsed object — and re-stringifying can drift a signature. A verify() hook stashes the exact received buffer, so signing and verification always agree byte-for-byte.",
    tag: "express.json({ verify })",
    stat: "0 parsing drift",
  },
  {
    id: "timing",
    title: "Constant-time, no-throw compare",
    body: "timingSafeEqual demands equal-length buffers, so length is guarded before the compare — a forged signature can neither time the secret nor crash the worker with an exception.",
    tag: "crypto.timingSafeEqual",
    stat: "31ms p50",
  },
  {
    id: "replay",
    title: "Replay-proof by design",
    body: "A ±5-minute freshness window rejects stale captures, and every nonce is single-use with a TTL sweep. Crucially, nonces are consumed only after the signature passes — forgeries can't poison the replay cache.",
    tag: "nonce TTL sweep · 60s",
    stat: "409 on reuse",
  },
];

/* =============== playground =============== */

export const CODE_TABS = [
  {
    id: "curl",
    label: "cURL — signed request",
    lang: "sh" as const,
    code: [
      "BODY='{\"event\":\"stock.updated\",\"sku\":\"NS-1042\",\"stock\":118}'",
      "TS=$(date +%s%3N); NONCE=$(uuidgen)",
      "SIG=$(printf '%s.%s.%s' \"$TS\" \"$NONCE\" \"$BODY\" \\",
      "  | openssl dgst -sha256 -hmac \"$WEBHOOK_SECRET\" -hex \\",
      "  | awk '{print $2}')",
      "",
      "curl -X POST https://api.northstar.dev/webhooks/inventory \\",
      "  -H \"X-NS-Timestamp: $TS\" \\",
      "  -H \"X-NS-Nonce: $NONCE\" \\",
      "  -H \"X-NS-Signature: sha256=$SIG\" \\",
      "  -d \"$BODY\"",
    ],
  },
  {
    id: "node",
    label: "Node — sign like a supplier",
    lang: "js" as const,
    code: [
      "const crypto = require('node:crypto');",
      "",
      "// One canonical base, one encoding — hex, always.",
      "function sign(secret, ts, nonce, body) {",
      "  return crypto.createHmac('sha256', secret)",
      "    .update(ts + '.' + nonce + '.' + body)",
      "    .digest('hex');",
      "}",
      "",
      "const sig = sign(SECRET, Date.now(), nonce, rawBody);",
      "headers['X-NS-Signature'] = 'sha256=' + sig;",
    ],
  },
  {
    id: "verify",
    label: "Express — verify middleware",
    lang: "js" as const,
    code: [
      "// Capture exact received bytes BEFORE parsing.",
      "app.use(express.json({",
      "  verify: (req, res, buf) => { req.rawBody = buf; },",
      "}));",
      "",
      "const expected = crypto.createHmac('sha256', SECRET)",
      "  .update(ts + '.' + nonce + '.' + req.rawBody)",
      "  .digest('hex');",
      "",
      "if (expected.length !== provided.length ||",
      "    !crypto.timingSafeEqual(",
      "      Buffer.from(expected), Buffer.from(provided))) {",
      "  return res.status(401).json({ error: 'invalid signature' });",
      "}",
    ],
  },
];

export type ScenarioId = "valid" | "tamper" | "stale" | "replay";

export const SCENARIOS: {
  id: ScenarioId;
  label: string;
  hint: string;
}[] = [
  {
    id: "valid",
    label: "Valid signed update",
    hint: "Signed over the exact bytes sent · fresh timestamp · unused nonce",
  },
  {
    id: "tamper",
    label: "Tampered body",
    hint: "stock changed from 118 to 999 after signing — signature no longer matches",
  },
  {
    id: "stale",
    label: "Stale timestamp",
    hint: "Signed 6 minutes ago — outside the ±5-minute freshness window",
  },
  {
    id: "replay",
    label: "Replayed nonce",
    hint: "A perfect copy of a request the store already accepted",
  },
];

export const VERIFY_STEPS = [
  "raw body captured",
  "freshness window · ±5 min",
  "nonce single-use check",
  "HMAC-SHA256 · constant-time",
];

/* =============== deploy =============== */

export const DEPLOY_BLOCKS = [
  {
    id: "static",
    title: "The site · static",
    note: "vercel.json & netlify.toml are already committed",
    lines: ["npm run build", "npx vercel --prod", "# or: npx netlify-cli deploy --prod --dir=dist", "# or: npx wrangler pages deploy dist"],
  },
  {
    id: "api",
    title: "The API · Node",
    note: "server/Dockerfile + server/fly.toml + render.yaml included",
    lines: [
      "cd server",
      "fly launch --copy-config && fly deploy",
      "fly secrets set WEBHOOK_SECRET=\"$(openssl rand -hex 32)\"",
      "# or Render: New → Blueprint → select this repo",
    ],
  },
  {
    id: "verify",
    title: "Prove it live",
    note: "same secret on host and signer — never the dev placeholder",
    lines: [
      "export WEBHOOK_SECRET=\"<host secret>\"",
      "export BASE=\"https://<your-api-url>\"",
      "./server/send.sh            # → HTTP/1.1 200 OK",
      "./server/send.sh --tamper   # → 401 · --stale → 400 · --replay → 409",
    ],
  },
];

/* =============== changelog =============== */

export const CHANGELOG = {
  version: "v0.1.0",
  name: "First light",
  date: "20 Feb 2026",
  added: [
    "HMAC-SHA256 verification over raw request bytes (express.json verify hook)",
    "±5-minute freshness window on X-NS-Timestamp",
    "Single-use nonces with a 60-second TTL sweep — replays answer 409",
    "Constant-time comparison, length-guarded before timingSafeEqual",
    "GET /inventory/:sku with source provenance for the support desk",
    "One-command deploys: vercel.json, netlify.toml, server/Dockerfile, render.yaml",
  ],
  fixed: [
    { id: "BLD-01", text: "Signature mismatch from verifying a re-parsed object instead of raw bytes" },
    { id: "BLD-02", text: "ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH — hex/base64 encoding mix-up" },
    { id: "BLD-03", text: "Replayed request double-applied a stock delta before the nonce was consumed" },
  ],
  roadmap: ["idempotency keys", "dead-letter queue", "regional failover", "signature rotation"],
};

/* =============== live stream generator =============== */

export type StreamEvent = {
  id: number;
  time: string;
  sku: string;
  status: 200 | 400 | 401 | 409;
  sig: string;
  detail: string;
  stock?: number;
};

const SKUS = ["NS-1042", "NS-2210", "NS-0387", "NS-4471", "NS-5508"];

function randHex(n: number): string {
  const bytes = new Uint8Array(Math.ceil(n / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, n);
}

let streamSeq = 0;

export function makeStreamEvent(): StreamEvent {
  const roll = Math.random();
  const sku = SKUS[Math.floor(Math.random() * SKUS.length)];
  const sig = randHex(14);
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  const id = ++streamSeq;

  if (roll < 0.68) {
    const stock = 40 + Math.floor(Math.random() * 160);
    return { id, time, sku, status: 200, sig, detail: "accepted · store updated", stock };
  }
  if (roll < 0.8) {
    return { id, time, sku, status: 401, sig, detail: "invalid signature" };
  }
  if (roll < 0.9) {
    return { id, time, sku, status: 400, sig, detail: "timestamp outside window" };
  }
  return { id, time, sku, status: 409, sig, detail: "nonce replay blocked" };
}
