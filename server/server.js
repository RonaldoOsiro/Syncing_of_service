// ============================================================
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
