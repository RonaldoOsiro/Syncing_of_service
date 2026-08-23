/* =============== sprint meta =============== */
export const SPRINT = {
  client: "Solstice Events Co.",
  service: "Event Check-In Kiosk Service",
  sprint: "Mid-sprint pivot · Day 4 of 7",
  pivotId: "PIVOT-07",
  vendor: "BadgeWorks Vendor API",
  notice:
    "DEPRECATION NOTICE — the synchronous print-confirmation endpoint (POST /v1/print, blocking) is end-of-life in 72 hours. All integrations must move to the async job model: publish print jobs to the badge-print queue and receive completion via signed webhooks. The blocking API will return 410 Gone after the window.",
  phase: "REFACTOR_AUDIT",
  deadline: "Hard deadline: ship before doors open Saturday 09:00. No extensions, no scope negotiation.",
};

export const NAV_LINKS = [
  { href: "#floor", label: "Kiosk floor" },
  { href: "#harness", label: "Test harness" },
  { href: "#verdict", label: "Verdict" },
  { href: "#delta", label: "Scope delta" },
  { href: "#code", label: "Refactor" },
  { href: "#index", label: "Adaptability" },
  { href: "#trail", label: "Audit trail" },
];

/* =============== attendees =============== */
export type SeedAttendee = {
  id: string;
  name: string;
  ticket: string;
  tier: string;
  state: "NOT_CHECKED_IN" | "PENDING_PRINT" | "CHECKED_IN";
  note: string;
  checkedInAt?: string;
};

export const ATTENDEES: SeedAttendee[] = [
  {
    id: "att-01",
    name: "Mara Voss",
    ticket: "GA-1042",
    tier: "General Admission",
    state: "NOT_CHECKED_IN",
    note: "Happy path — scenarios S1–S3",
  },
  {
    id: "att-02",
    name: "Idris Kane",
    ticket: "VIP-2210",
    tier: "VIP · backstage",
    state: "NOT_CHECKED_IN",
    note: "Forged-callback target — scenario S4a",
  },
  {
    id: "att-03",
    name: "Sana Ortiz",
    ticket: "GA-3307",
    tier: "General Admission",
    state: "CHECKED_IN",
    note: "Pre-seeded terminal state — duplicate-scan guard",
    checkedInAt: "08:41:12",
  },
];

/* =============== scenarios =============== */
export type Scenario = {
  id: "S1" | "S2" | "S3" | "S4";
  title: string;
  target: string;
  expect: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "S1",
    title: "Valid scan",
    target: "Mara Voss · GA-1042",
    expect: "202 Accepted → PENDING_PRINT, job published to badge-print queue",
  },
  {
    id: "S2",
    title: "Immediate rapid re-scan",
    target: "Mara (PENDING_PRINT) + Sana (CHECKED_IN)",
    expect: "409 duplicate_scan in BOTH non-initial states — guard holds async",
  },
  {
    id: "S3",
    title: "Valid webhook signature",
    target: "Vendor callback for Mara's job",
    expect: "HMAC verified → 200 OK → state transitions to CHECKED_IN",
  },
  {
    id: "S4",
    title: "Forged signature + stale job",
    target: "Tampered callback (Idris) + unknown jobId",
    expect: "403 Forbidden on bad signature · 409 Conflict on stale job id",
  },
];

/* =============== scope delta analysis =============== */
export const DELTA = {
  dropped: [
    "Synchronous print call on QR scan — BadgePrinterClient.callSync()",
    "Blocking UI: 'Checked In' shown only after vendor 200 returned inline",
    "Legacy polling loop — GET /vendor/status every 2s until terminal",
    "Inline retry/backoff on vendor timeout (superseded by queue redelivery)",
  ],
  modified: [
    "POST /check-ins/:id/scan now answers 202 Accepted + jobId — kiosk never blocks",
    "State machine gains PENDING_PRINT between NOT_CHECKED_IN and CHECKED_IN",
    "Duplicate-scan guard extended to reject across PENDING_PRINT and CHECKED_IN",
    "UI copy: badge reveals only after a verified webhook — never on scan alone",
  ],
  added: [
    "QueuePublisher.publish(printJob) — badge-print queue with redelivery",
    "POST /vendor/print-events — webhook receiver with HMAC-SHA256 verification",
    "Freshness window + single-use jobId check on every callback (anti-replay)",
    "Ops surface: job dashboard, callback inbox, and the TRAIL audit log",
  ],
};

export type TradeOffRow = {
  dimension: string;
  before: string;
  after: string;
  decision: string;
};

export const TRADE_OFFS: TradeOffRow[] = [
  {
    dimension: "Latency to 'Checked In'",
    before: "600–900 ms vendor round-trip, blocking the lane",
    after: "~1.5–2.5 s end-to-end (queue + print + callback)",
    decision:
      "Accept — perceived speed preserved: kiosk shows PENDING_PRINT instantly, line never stalls",
  },
  {
    dimension: "Failure blast radius",
    before: "Vendor outage freezes the entire check-in line",
    after: "Queue buffers jobs; kiosk keeps scanning through outages",
    decision: "Accept — doors-open resilience beats raw speed",
  },
  {
    dimension: "Security surface",
    before: "Internal call only — nothing public",
    after: "Public webhook endpoint — spoofable by design",
    decision:
      "Mitigate — HMAC-SHA256 signature + freshness window + single-use job ids (proven by S4a/S4b)",
  },
  {
    dimension: "Complexity",
    before: "One call path to reason about",
    after: "Three units: publisher, queue worker, webhook receiver",
    decision:
      "Accept — each unit independently testable; legacy sync path deleted outright (guardrail 1)",
  },
  {
    dimension: "Consistency model",
    before: "Strong — print confirmed before UI updates",
    after: "Eventual — state converges when the callback lands",
    decision:
      "Mitigate — idempotent receiver; duplicate guard spans every non-initial state (guardrail 2)",
  },
];

/* =============== evaluation matrix (RANK) =============== */
export type Dimension = {
  id: "adaptation" | "integrity" | "delta";
  name: string;
  weight: number;
  pass: string;
  fail: string;
  checks: string[];
};

export const DIMENSIONS: Dimension[] = [
  {
    id: "adaptation",
    name: "Adaptation Completeness",
    weight: 40,
    pass: "Webhook endpoint and queue publisher operational; state machine includes PENDING_PRINT.",
    fail: "Relies on synchronous print response or missing webhook logic.",
    checks: [
      "Job published to badge-print queue",
      "Kiosk reached PENDING_PRINT",
      "A signed webhook was verified end-to-end",
    ],
  },
  {
    id: "integrity",
    name: "Architectural Integrity",
    weight: 30,
    pass: "Obsolete synchronous code completely removed; duplicate scans blocked in all non-initial states.",
    fail: "Legacy synchronous code left running in parallel.",
    checks: [
      "Sync client + polling loop dropped (no legacy path live)",
      "Duplicate scan rejected in PENDING_PRINT",
      "Duplicate scan rejected in CHECKED_IN",
    ],
  },
  {
    id: "delta",
    name: "Trade-Off & Scope Delta",
    weight: 30,
    pass: "Scope Delta Analysis documents dropped / modified / added tasks and latency-vs-security trade-offs.",
    fail: "Delta undocumented or trade-offs unstated.",
    checks: [
      "Dropped / modified / added ledger published",
      "Latency vs. security matrix recorded with decisions",
    ],
  },
];

/* =============== adaptability index template =============== */
export const ADAPTABILITY = {
  ratings: [
    { axis: "Speed of adaptation", prompt: "Notice received → refactored build green, in hours" },
    { axis: "Quality under pressure", prompt: "Regressions introduced by the pivot (target: 0)" },
    { axis: "Scope discipline", prompt: "Unrequested work resisted; delta ledger stays honest" },
    { axis: "Communication", prompt: "Deprecation notice surfaced + trade-offs narrated before asked" },
  ],
  guardrails: [
    "Obsolete sync code fully removed — nothing runs side-by-side",
    "Duplicate-scan protection holds across PENDING_PRINT and CHECKED_IN",
    "Webhook payload signatures verified (HMAC-SHA256)",
    "Deadline held — no extension requested",
  ],
  formula:
    "INDEX = (0.4 × Adaptation Completeness + 0.3 × Architectural Integrity + 0.3 × Scope Delta) × guardrail multiplier — multiplier is 0.9 per violated guardrail, 1.0 when all four hold",
};

/* =============== refactor code views =============== */
export const LEGACY_CODE = `// ============================================================
// REMOVED — vendor deprecated the synchronous print API (410 Gone)
// Guardrail 1: no legacy path may run side-by-side. Deleted outright.
// ============================================================
app.post('/check-ins/:id/scan', async (req, res) => {
  const att = attendees.get(req.params.id);
  if (att.state !== 'NOT_CHECKED_IN') return res.status(409).json({ error: 'duplicate' });

  // BLOCKING — the whole kiosk lane waited on the vendor round-trip
  const result = await BadgePrinterClient.callSync({
    attendeeId: att.id,
    layout: att.tier === 'VIP' ? 'backstage' : 'standard',
  });

  if (!result.printed) return res.status(502).json({ error: 'printer failed' });
  att.state = 'CHECKED_IN';          // trusted a sync 200 with no signature
  res.json({ state: 'CHECKED_IN' });
});

// Legacy polling loop — also deleted
setInterval(() => pollVendorStatus(), 2000);`;

export const REFACTORED_CODE = `// ============================================================
// ASYNC FLOW — publish to queue, trust only signed callbacks
// ============================================================
app.post('/check-ins/:id/scan', (req, res) => {
  const att = attendees.get(req.params.id);

  // Guardrail 2 — duplicates blocked in EVERY non-initial state
  if (att.state === 'PENDING_PRINT' || att.state === 'CHECKED_IN') {
    return res.status(409).json({ error: 'duplicate_scan', state: att.state });
  }

  att.state = 'PENDING_PRINT';
  const job = { jobId: uid(), attendeeId: att.id, ts: Date.now() };
  QueuePublisher.publish('badge-print', job);     // fire-and-forget
  res.status(202).json({ state: att.state, jobId: job.jobId });
});

// Vendor calls back here when the badge is physically printed.
app.post('/vendor/print-events', express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; },
}), (req, res) => {
  const sig = (req.header('X-Solstice-Signature') || '').replace('sha256=', '');

  // Guardrail 3 — HMAC-SHA256 over the raw bytes, constant-time compare
  const expected = hmac('sha256', VENDOR_SECRET).update(req.rawBody).digest('hex');
  if (!safeEqual(expected, sig)) return res.status(403).json({ error: 'bad_signature' });

  const { jobId, status } = req.body;
  const job = jobs.get(jobId);
  if (!job || job.done) return res.status(409).json({ error: 'stale_or_unknown_job' });

  job.done = true;                                 // consume BEFORE mutating
  if (status === 'printed') {
    const att = attendees.get(job.attendeeId);
    if (att.state === 'PENDING_PRINT') att.state = 'CHECKED_IN';
  }
  res.status(200).json({ ok: true });
});`;

export const VENDOR_SECRET = "solstice-vendor-hmac-secret";

/* =============== seed trail =============== */
export const SEED_TRAIL = [
  {
    timestamp: "2026-02-17T09:04:11Z",
    sprint_phase: "ORIGINAL_BUILD",
    component_changed: "BadgePrinterClient.callSync()",
    action_taken: "ADDED",
    security_status: "UNVERIFIED",
    audit_note:
      "Baseline sync print flow built for 3 test attendees (incl. 1 duplicate-scan case). Kiosk blocks on vendor 200 before showing CHECKED_IN.",
  },
  {
    timestamp: "2026-02-17T09:31:47Z",
    sprint_phase: "ORIGINAL_BUILD",
    component_changed: "GET /vendor/status (polling)",
    action_taken: "ADDED",
    security_status: "UNVERIFIED",
    audit_note:
      "2-second polling loop added to reconcile print status. Flagged for review — chattiest component in the build.",
  },
  {
    timestamp: "2026-02-18T14:02:09Z",
    sprint_phase: "PIVOT_INJECTED",
    component_changed: "BadgeWorks vendor API",
    action_taken: "MODIFIED",
    security_status: "UNVERIFIED",
    audit_note:
      "Deprecation notice received: POST /v1/print goes 410 Gone in 72h. Directive: queue-publish + signed webhook receiver. Sync path must not ship.",
  },
  {
    timestamp: "2026-02-18T15:47:33Z",
    sprint_phase: "REFACTOR_AUDIT",
    component_changed: "BadgePrinterClient.callSync() + polling loop",
    action_taken: "DROPPED",
    security_status: "UNVERIFIED",
    audit_note:
      "Sync client, inline retry and the 2s polling loop deleted from the build. No legacy path remains executable — guardrail 1 satisfied.",
  },
  {
    timestamp: "2026-02-18T16:12:58Z",
    sprint_phase: "REFACTOR_AUDIT",
    component_changed: "QueuePublisher.publish('badge-print')",
    action_taken: "ADDED",
    security_status: "UNVERIFIED",
    audit_note:
      "Scan endpoint now answers 202 Accepted with a jobId and publishes to the badge-print queue. Kiosk transitions to PENDING_PRINT immediately.",
  },
  {
    timestamp: "2026-02-18T16:40:21Z",
    sprint_phase: "REFACTOR_AUDIT",
    component_changed: "POST /vendor/print-events",
    action_taken: "ADDED",
    security_status: "VERIFIED_HMAC",
    audit_note:
      "Webhook receiver live: HMAC-SHA256 over raw bytes, constant-time compare, freshness window, single-use jobIds. CHECKED_IN set only on a verified callback.",
  },
];
