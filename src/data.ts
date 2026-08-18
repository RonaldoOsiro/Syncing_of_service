import type { Lang } from "./highlight";

/* ================= sprint meta ================= */
export const SPRINT = {
  program: "Meridian Pivot",
  assignment: "Assignment 1",
  phase: "Days 1–2 · Solo Recon",
  tool: "Webhook Signature Verification",
  concept: "HMAC SHA-256 over raw request bytes, with a replay guard",
  company: "Northstar Retail Co.",
  purpose:
    "A live inventory sync service that keeps support responses accurate — updates are only trusted when they carry a valid signature.",
  targetHours: 4.0,
  actualHours: 3.5,
  status: "PASS",
};

/* ================= Step 1 — codebase ================= */
export type CodeFile = {
  name: string;
  lang: Lang;
  note: string;
  code: string;
};

export const SERVER_JS = `// ============================================================
// northstar-inventory-hook — Assignment 1 mini-prototype
// Tool: Webhook Signature Verification (HMAC SHA-256)
// Sprint: Meridian Pivot, Days 1-2. Built solo, no outside help.
//
// A supplier POSTs inventory updates to /webhooks/inventory.
// We refuse to trust a request unless it carries a valid
// signature over "<timestamp>.<nonce>.<raw body>".
// ============================================================
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.WEBHOOK_SECRET || 'meridian-dev-secret';
const MAX_SKEW_MS = Number(process.env.MAX_SKEW_MS || 5 * 60 * 1000);

// --- Replay guard -------------------------------------------
// nonce -> time we consumed it. A nonce is single-use inside the
// skew window; a sweeper prunes expired entries so this Map
// cannot grow without bound.
const seenNonces = new Map();
setInterval(() => {
  const cutoff = Date.now() - MAX_SKEW_MS * 2;
  for (const [nonce, at] of seenNonces) {
    if (at < cutoff) seenNonces.delete(nonce);
  }
}, 60 * 1000).unref();

// Tiny in-memory store so the support desk reads live stock.
const inventory = new Map([
  ['NS-1042', { sku: 'NS-1042', stock: 96, updatedAt: null, source: 'seed' }],
]);

// --- Body parsing with raw capture --------------------------
// Blocker #1 lesson: express.json() replaces the raw stream with
// a parsed object. The verify() hook runs BEFORE parsing, so we
// stash the exact received bytes and sign/verify against those —
// never against a re-stringified object.
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

// Canonical string both signer and verifier must agree on.
function signingBase(ts, nonce, rawBody) {
  return [ts, nonce, rawBody].join('.');
}

// HMAC-SHA256 as lowercase hex — one encoding everywhere
// (Blocker #2 lesson: never mix hex and base64).
function computeSignature(ts, nonce, rawBody) {
  return crypto.createHmac('sha256', SECRET)
    .update(signingBase(ts, nonce, rawBody))
    .digest('hex');
}

// Constant-time comparison that can never throw.
// timingSafeEqual demands equal-length buffers, so a length
// mismatch is rejected BEFORE the compare, not by a try/catch.
function safeEqual(a, b) {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyWebhook(req, res, next) {
  const ts = req.header('X-NS-Timestamp');
  const nonce = req.header('X-NS-Nonce');
  const sig = req.header('X-NS-Signature') || '';

  if (!ts || !nonce || !req.rawBody) {
    return res.status(400).json({ error: 'missing signature headers' });
  }

  // 1) Freshness — reject anything outside the skew window.
  const age = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(age) || age > MAX_SKEW_MS) {
    return res.status(400).json({ error: 'timestamp outside window' });
  }

  // 2) Replay — a nonce may be consumed exactly once.
  if (seenNonces.has(nonce)) {
    return res.status(409).json({ error: 'nonce already seen' });
  }

  // 3) Authenticity — recompute the HMAC over the raw bytes.
  const expected = computeSignature(ts, nonce, req.rawBody.toString('utf8'));
  const provided = sig.replace(/^sha256=/, '');
  if (!safeEqual(expected, provided)) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  // Consume the nonce only AFTER the signature passes, so forged
  // requests cannot poison the replay cache.
  seenNonces.set(nonce, Date.now());
  next();
}

// --- Routes --------------------------------------------------
app.post('/webhooks/inventory', verifyWebhook, (req, res) => {
  const { event, sku, stock } = req.body || {};
  if (event !== 'stock.updated' || typeof stock !== 'number') {
    return res.status(422).json({ error: 'unsupported event payload' });
  }
  inventory.set(sku, {
    sku,
    stock,
    updatedAt: new Date().toISOString(),
    source: 'webhook:verified',
  });
  res.status(200).json({ ok: true, received: event, sku, stock });
});

// What the support desk actually reads.
app.get('/inventory/:sku', (req, res) => {
  const row = inventory.get(req.params.sku);
  if (!row) return res.status(404).json({ error: 'sku not found' });
  res.json(row);
});

app.listen(PORT, () => {
  console.log('northstar inventory webhook listening on :' + PORT);
});
`;

export const SEND_SH = `#!/usr/bin/env bash
# Signs and sends a stock update the way our supplier would.
# Usage: ./send.sh [--tamper | --stale | --replay]
set -euo pipefail

SECRET="\${WEBHOOK_SECRET:-meridian-dev-secret}"
TS="$(date +%s%3N)"                 # unix time in milliseconds
NONCE="$(uuidgen)"
BODY='{"event":"stock.updated","sku":"NS-1042","stock":118,"warehouse":"ATL-02"}'

case "\${1:-}" in
  --tamper) BODY='{"event":"stock.updated","sku":"NS-1042","stock":999,"warehouse":"ATL-02"}' ;;
  --stale)  TS="$(( $(date +%s%3N) - 360000 ))" ;;   # 6 minutes in the past
  --replay) NONCE="f3d1c2a4-replay-fixed-nonce" ;;
esac

# HMAC-SHA256 over "<ts>.<nonce>.<body>" — the same canonical
# signing base server.js recomputes. Hex, always hex.
SIG="$(printf '%s.%s.%s' "$TS" "$NONCE" "$BODY" \\
  | openssl dgst -sha256 -hmac "$SECRET" -hex \\
  | awk '{print $2}')"

curl -i -sS -X POST "http://localhost:3000/webhooks/inventory" \\
  -H "Content-Type: application/json" \\
  -H "X-NS-Timestamp: $TS" \\
  -H "X-NS-Nonce: $NONCE" \\
  -H "X-NS-Signature: sha256=$SIG" \\
  -d "$BODY"
`;

export const PACKAGE_JSON = `{
  "name": "northstar-inventory-hook",
  "version": "0.1.0",
  "private": true,
  "description": "Meridian Pivot sprint — verified inventory webhooks for Northstar Retail Co.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  }
}
`;

export const ENV_EXAMPLE = `# Copy to .env — never commit the real secret.
# Generate one with:  openssl rand -hex 32
WEBHOOK_SECRET=meridian-dev-secret
PORT=3000
MAX_SKEW_MS=300000
`;

export const FILES: CodeFile[] = [
  {
    name: "server.js",
    lang: "js",
    note: "Express 4 · node:crypto only — zero external services",
    code: SERVER_JS,
  },
  {
    name: "send.sh",
    lang: "sh",
    note: "supplier-side signer — openssl HMAC over ts.nonce.body",
    code: SEND_SH,
  },
  {
    name: "package.json",
    lang: "json",
    note: "two runtime dependencies, nothing else",
    code: PACKAGE_JSON,
  },
  {
    name: ".env.example",
    lang: "sh",
    note: "secrets stay out of the repo",
    code: ENV_EXAMPLE,
  },
];

/* ================= Step 2 — runbook ================= */
export type RunBlock = { cmd?: string; out?: string[] };
export type RunStep = {
  n: string;
  title: string;
  desc: string;
  blocks: RunBlock[];
};

export const RUN_STEPS: RunStep[] = [
  {
    n: "01",
    title: "Scaffold the project",
    desc: "Empty directory, fresh manifest, two runtime deps. Nothing else is needed — signing uses node:crypto.",
    blocks: [
      { cmd: "mkdir northstar-inventory-hook && cd northstar-inventory-hook" },
      { cmd: "npm init -y" },
      { cmd: "npm install express dotenv" },
    ],
  },
  {
    n: "02",
    title: "Drop in the files & configure secrets",
    desc: "Copy server.js, send.sh and package.json from Step 1, then create .env from the example. The dev secret is for localhost only.",
    blocks: [
      { cmd: "cp .env.example .env" },
      { cmd: "openssl rand -hex 32   # use this as WEBHOOK_SECRET in production" },
      { cmd: "chmod +x send.sh" },
    ],
  },
  {
    n: "03",
    title: "Start the service",
    desc: "Plain node is enough; npm run dev adds --watch while iterating.",
    blocks: [
      { cmd: "node server.js" },
      { out: ["northstar inventory webhook listening on :3000"] },
    ],
  },
  {
    n: "04",
    title: "Send a signed update",
    desc: "send.sh builds the canonical base ts.nonce.body, HMACs it with openssl, and posts the three X-NS-* headers.",
    blocks: [
      { cmd: "./send.sh" },
      {
        out: [
          'HTTP/1.1 200 OK',
          '{"ok":true,"received":"stock.updated","sku":"NS-1042","stock":118}',
        ],
      },
    ],
  },
  {
    n: "05",
    title: "Prove the rejections",
    desc: "Each flag attacks one guard: integrity, freshness, single-use. All three must bounce.",
    blocks: [
      { cmd: "./send.sh --tamper" },
      { out: ['HTTP/1.1 401 Unauthorized · {"error":"invalid signature"}'] },
      { cmd: "./send.sh --stale" },
      { out: ['HTTP/1.1 400 Bad Request · {"error":"timestamp outside window"}'] },
      { cmd: "./send.sh --replay && ./send.sh --replay" },
      { out: ['HTTP/1.1 409 Conflict · {"error":"nonce already seen"}'] },
    ],
  },
  {
    n: "06",
    title: "Read back live inventory",
    desc: "The endpoint the support desk queries — stock now carries provenance, so an agent knows the number came from a verified webhook.",
    blocks: [
      { cmd: "curl -s http://localhost:3000/inventory/NS-1042" },
      {
        out: [
          '{"sku":"NS-1042","stock":118,"updatedAt":"2026-02-20T16:41:07.214Z","source":"webhook:verified"}',
        ],
      },
    ],
  },
];

/* ================= Step 3 — journal ================= */
export const RESOURCES = [
  {
    src: "Node.js Docs — crypto",
    url: "nodejs.org/api/crypto.html",
    takeaway:
      "createHmac().digest('hex') produces the MAC; crypto.timingSafeEqual only runs on equal-length buffers — it throws otherwise, so guard the length yourself.",
  },
  {
    src: "Stripe — Webhooks best practices",
    url: "stripe.com/docs/webhooks/best-practices",
    takeaway:
      "Industry pattern: sign timestamp + payload, enforce a short skew window, and persist a per-event id (nonce) so redeliveries stay idempotent.",
  },
  {
    src: "Express 4.x API — express.json() options",
    url: "expressjs.com/en/4x/api.html#express.json",
    takeaway:
      "The verify(req, res, buf) callback fires before parsing — the sanctioned place to stash the raw bytes a signature was computed over.",
  },
  {
    src: "RFC 2104 — HMAC: Keyed-Hashing for Message Authentication",
    url: "datatracker.ietf.org/doc/html/rfc2104",
    takeaway:
      "Why a secret-keyed MAC beats hashing the secret into the payload: naive concatenation is exposed to length-extension attacks.",
  },
];

export type Blocker = {
  id: number;
  title: string;
  phase: string;
  error: string[];
  root: string;
  fix: string;
};

export const BLOCKERS: Blocker[] = [
  {
    id: 1,
    title: "Every signature failed — body parsed before verification",
    phase: "Hour 0.8 · Middleware configuration",
    error: [
      "[hook] expected sha256=3f9ab71c44de02e6…",
      "[hook] received sha256=9d4410be77aa91c3…",
      'POST /webhooks/inventory 401 2.3 ms - {"error":"invalid signature"}',
    ],
    root: "express.json() had already consumed the request stream and replaced it with a parsed object. The verifier re-stringified req.body to recompute the HMAC — but JSON.stringify regenerates key order and whitespace, so the bytes never matched what the sender actually signed.",
    fix: "Passed a verify callback to express.json() that stashes the untouched buffer on req.rawBody, and pointed computeSignature() at those exact bytes. First green digest on the very next send.",
  },
  {
    id: 2,
    title: "timingSafeEqual threw a RangeError instead of returning false",
    phase: "Hour 2.1 · Signature comparison",
    error: [
      "RangeError [ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH]:",
      "Input buffers must have the same byte length",
      "    at Object.timingSafeEqual (node:crypto:357:11)",
      "    at verifyWebhook (/srv/northstar-inventory-hook/server.js:71:24)",
    ],
    root: "timingSafeEqual refuses to run on unequal-length buffers, and my two test scripts disagreed about encoding: the server digested hex (64 chars) while the scratch client sent base64 (44 chars). The throw fired before any comparison, turning a routine 401 into a 500.",
    fix: "Normalized both sides to hex everywhere, added safeEqual() that length-checks before comparing, and made sure a malformed header can never crash the process. Bonus: the length check is itself a constant-time-safe early return.",
  },
  {
    id: 3,
    title: "Replay — an intercepted valid request was accepted again",
    phase: "Hour 2.9 · Replay testing",
    error: [
      "send #1 → 200 {\"ok\":true,\"sku\":\"NS-1042\",\"stock\":118}",
      "send #2 → 200 {\"ok\":true,\"sku\":\"NS-1042\",\"stock\":118}   ← identical request accepted again",
      "inventory event duplicated in log — stock applied twice",
    ],
    root: "A signature proves origin and integrity, not freshness. Nothing on the server remembered what it had already processed, so a captured — perfectly valid — request could be resent indefinitely and double-apply stock changes.",
    fix: "Made X-NS-Timestamp and X-NS-Nonce mandatory: timestamps outside ±5 minutes get 400, and nonces are single-use inside the window (Map + TTL sweeper) with a 409 on repeats. The nonce is consumed only after the HMAC passes, so forged requests can't poison the cache.",
  },
];

export const VALIDATION: { t: "cmd" | "ok" | "err" | "info"; text: string }[] = [
  { t: "cmd", text: "$ node server.js" },
  { t: "info", text: "northstar inventory webhook listening on :3000" },
  { t: "cmd", text: "$ ./send.sh                      # valid signature" },
  {
    t: "ok",
    text: 'HTTP/1.1 200 OK · {"ok":true,"received":"stock.updated","sku":"NS-1042","stock":118}',
  },
  { t: "cmd", text: "$ ./send.sh --tamper             # body altered after signing" },
  { t: "err", text: 'HTTP/1.1 401 Unauthorized · {"error":"invalid signature"}' },
  { t: "cmd", text: "$ ./send.sh --stale              # timestamp 6 minutes old" },
  { t: "err", text: 'HTTP/1.1 400 Bad Request · {"error":"timestamp outside window"}' },
  { t: "cmd", text: "$ ./send.sh --replay && ./send.sh --replay" },
  { t: "err", text: 'HTTP/1.1 409 Conflict · {"error":"nonce already seen"}' },
  { t: "cmd", text: "$ curl -s http://localhost:3000/inventory/NS-1042" },
  {
    t: "ok",
    text: '{"sku":"NS-1042","stock":118,"updatedAt":"2026-02-20T16:41:07.214Z","source":"webhook:verified"}',
  },
];

/* ================= live bench fixtures ================= */
export const BENCH_SECRET = "meridian-dev-secret";
export const BENCH_BODY =
  '{"event":"stock.updated","sku":"NS-1042","stock":118,"warehouse":"ATL-02"}';
export const BENCH_TAMPERED =
  '{"event":"stock.updated","sku":"NS-1042","stock":999,"warehouse":"ATL-02"}';
