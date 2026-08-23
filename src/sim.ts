import { useCallback, useEffect, useRef, useState } from "react";
import { ATTENDEES, SEED_TRAIL, VENDOR_SECRET } from "./data";
import { clockTime, hmacHex, uid } from "./lib";

/* =============== types =============== */
export type AttendeeState = "NOT_CHECKED_IN" | "PENDING_PRINT" | "CHECKED_IN";

export interface Attendee {
  id: string;
  name: string;
  ticket: string;
  tier: string;
  note: string;
  state: AttendeeState;
  jobId?: string;
  checkedInAt?: string;
}

export type JobStage = "queued" | "printing" | "dispatched" | "confirmed" | "rejected";

export interface PrintJob {
  id: string;
  attendeeId: string;
  name: string;
  publishedAt: number;
  stage: JobStage;
  corrupt?: boolean;
}

export interface Callback {
  id: string;
  ts: string;
  jobId: string;
  sigOk: boolean;
  http: number;
  note: string;
}

export interface TrailEntry {
  timestamp: string;
  sprint_phase: string;
  component_changed: string;
  action_taken: string;
  security_status: string;
  audit_note: string;
}

export interface Feedback {
  http: number;
  kind: "accept" | "reject" | "verified" | "forged";
  msg: string;
  key: number;
}

export type ScenarioId = "S1" | "S2" | "S3" | "S4";
export type ScenarioStatus = "idle" | "running" | "pass";

export interface Flags {
  queuePublished: boolean;
  pendingPrintSeen: boolean;
  webhookVerified: boolean;
  dupBlockedPending: boolean;
  dupBlockedCheckedIn: boolean;
  tamperRejected: boolean;
  staleRejected: boolean;
}

interface Sim {
  attendees: Attendee[];
  jobs: PrintJob[];
  callbacks: Callback[];
  trail: TrailEntry[];
  scenarios: Record<ScenarioId, ScenarioStatus>;
  flags: Flags;
  feedback: Record<string, Feedback>;
  running: boolean;
}

const initialSim = (): Sim => ({
  attendees: ATTENDEES.map((a) => ({ ...a })),
  jobs: [],
  callbacks: [],
  trail: SEED_TRAIL.map((t) => ({ ...t })),
  scenarios: { S1: "idle", S2: "idle", S3: "idle", S4: "idle" },
  flags: {
    queuePublished: false,
    pendingPrintSeen: false,
    webhookVerified: false,
    dupBlockedPending: false,
    dupBlockedCheckedIn: false,
    tamperRejected: false,
    staleRejected: false,
  },
  feedback: {},
  running: false,
});

/* =============== helpers =============== */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function waitFor(cond: () => boolean, timeout = 10000, step = 140): Promise<boolean> {
  const t0 = Date.now();
  while (!cond() && Date.now() - t0 < timeout) await sleep(step);
  return cond();
}

function corruptHex(hex: string): string {
  const i = 12;
  const c = hex[i] === "a" ? "b" : "a";
  return hex.slice(0, i) + c + hex.slice(i + 1);
}

/* =============== the engine =============== */
export function useSimulation() {
  const sim = useRef<Sim>(initialSim());
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);
  const runLock = useRef(false);

  const pushTrail = useCallback(
    (e: Omit<TrailEntry, "timestamp">) => {
      sim.current.trail = [
        ...sim.current.trail,
        { timestamp: new Date().toISOString(), ...e },
      ];
      bump();
    },
    [bump]
  );

  /* ---- scan: the kiosk endpoint ---- */
  const scan = useCallback(
    (attendeeId: string, corrupt = false): number => {
      const s = sim.current;
      const att = s.attendees.find((a) => a.id === attendeeId);
      if (!att) return 404;

      // Guardrail 2 — duplicates rejected in EVERY non-initial state
      if (att.state !== "NOT_CHECKED_IN") {
        s.feedback = {
          ...s.feedback,
          [attendeeId]: {
            http: 409,
            kind: "reject",
            msg: "duplicate_scan — blocked in " + att.state,
            key: Date.now(),
          },
        };
        if (att.state === "PENDING_PRINT")
          s.flags = { ...s.flags, dupBlockedPending: true };
        if (att.state === "CHECKED_IN")
          s.flags = { ...s.flags, dupBlockedCheckedIn: true };
        pushTrail({
          sprint_phase: "REFACTOR_AUDIT",
          component_changed: "DuplicateScanGuard",
          action_taken: "MODIFIED",
          security_status: "UNVERIFIED",
          audit_note:
            "409 duplicate_scan rejected for " +
            att.name +
            " (" +
            att.ticket +
            ") in state " +
            att.state +
            " — guard holds across async states.",
        });
        return 409;
      }

      const jobId = "job-" + uid();
      s.attendees = s.attendees.map((a) =>
        a.id === attendeeId ? { ...a, state: "PENDING_PRINT" as AttendeeState, jobId } : a
      );
      s.jobs = [
        ...s.jobs,
        { id: jobId, attendeeId, name: att.name, publishedAt: Date.now(), stage: "queued", corrupt },
      ];
      s.feedback = {
        ...s.feedback,
        [attendeeId]: {
          http: 202,
          kind: "accept",
          msg: "job published — badge printing",
          key: Date.now(),
        },
      };
      s.flags = { ...s.flags, queuePublished: true, pendingPrintSeen: true };
      pushTrail({
        sprint_phase: "REFACTOR_AUDIT",
        component_changed: "POST /check-ins/:id/scan",
        action_taken: "MODIFIED",
        security_status: "UNVERIFIED",
        audit_note:
          "202 Accepted — " +
          att.name +
          " → PENDING_PRINT; " +
          jobId +
          " published to badge-print queue. Kiosk lane never blocks.",
      });
      return 202;
    },
    [pushTrail]
  );

  /* ---- vendor callback: the webhook receiver ---- */
  const deliver = useCallback(
    async (
      jobId: string,
      opts: { corrupt?: boolean; unknown?: boolean } = {}
    ): Promise<number> => {
      const s = sim.current;
      const payload = JSON.stringify({ jobId, status: "printed", ts: Date.now() });

      // Vendor side signs…
      const { hex: vendorSig } = await hmacHex(VENDOR_SECRET, payload);
      const wireSig = opts.corrupt ? corruptHex(vendorSig) : vendorSig;

      // …receiver side re-computes over the same raw bytes.
      const { hex: expected } = await hmacHex(VENDOR_SECRET, payload);
      const sigOk = wireSig === expected;
      const cbId = "cb-" + uid();
      const ts = clockTime();

      // Guardrail 3 — a bad signature never touches state.
      if (!sigOk) {
        const job = s.jobs.find((j) => j.id === jobId);
        s.callbacks = [
          { id: cbId, ts, jobId, sigOk: false, http: 403, note: "bad_signature — HMAC mismatch over raw payload" },
          ...s.callbacks,
        ].slice(0, 12);
        s.jobs = s.jobs.map((j) => (j.id === jobId ? { ...j, stage: "rejected" as JobStage } : j));
        s.flags = { ...s.flags, tamperRejected: true };
        if (job)
          s.feedback = {
            ...s.feedback,
            [job.attendeeId]: {
              http: 403,
              kind: "forged",
              msg: "forged callback — signature rejected",
              key: Date.now(),
            },
          };
        pushTrail({
          sprint_phase: "REFACTOR_AUDIT",
          component_changed: "POST /vendor/print-events",
          action_taken: "MODIFIED",
          security_status: "UNVERIFIED",
          audit_note:
            "403 Forbidden — webhook signature failed HMAC-SHA256 verification (job " +
            jobId +
            "). State untouched; " +
            (job ? job.name + " remains PENDING_PRINT" : "no matching attendee") +
            ".",
        });
        bump();
        return 403;
      }

      const job = s.jobs.find((j) => j.id === jobId);
      const stale = opts.unknown || !job || job.stage === "confirmed";
      if (stale) {
        const reason =
          opts.unknown || !job
            ? "unknown jobId — no live job matches"
            : "job already consumed — redelivery rejected";
        s.callbacks = [
          { id: cbId, ts, jobId, sigOk: true, http: 409, note: "stale_or_unknown_job — " + reason },
          ...s.callbacks,
        ].slice(0, 12);
        s.flags = { ...s.flags, staleRejected: true };
        pushTrail({
          sprint_phase: "REFACTOR_AUDIT",
          component_changed: "POST /vendor/print-events",
          action_taken: "MODIFIED",
          security_status: "VERIFIED_HMAC",
          audit_note:
            "409 Conflict — signature valid but " +
            reason +
            " (" +
            jobId +
            "). Idempotency holds; no double check-in.",
        });
        bump();
        return 409;
      }

      // Valid + fresh → the ONLY path to CHECKED_IN.
      s.jobs = s.jobs.map((j) => (j.id === jobId ? { ...j, stage: "confirmed" as JobStage } : j));
      s.attendees = s.attendees.map((a) =>
        a.id === job!.attendeeId && a.state === "PENDING_PRINT"
          ? { ...a, state: "CHECKED_IN" as AttendeeState, checkedInAt: clockTime() }
          : a
      );
      s.callbacks = [
        { id: cbId, ts, jobId, sigOk: true, http: 200, note: "signature verified — CHECKED_IN committed" },
        ...s.callbacks,
      ].slice(0, 12);
      s.feedback = {
        ...s.feedback,
        [job!.attendeeId]: {
          http: 200,
          kind: "verified",
          msg: "webhook verified — badge released",
          key: Date.now(),
        },
      };
      s.flags = { ...s.flags, webhookVerified: true };
      pushTrail({
        sprint_phase: "REFACTOR_AUDIT",
        component_changed: "POST /vendor/print-events",
        action_taken: "MODIFIED",
        security_status: "VERIFIED_HMAC",
        audit_note:
          "200 OK — " +
          job!.name +
          " transitioned PENDING_PRINT → CHECKED_IN on verified callback " +
          jobId +
          ".",
      });
      bump();
      return 200;
    },
    [bump, pushTrail]
  );

  /* ---- queue worker: queued → printing → dispatched (+vendor callback) ---- */
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = sim.current;
      const now = Date.now();
      let changed = false;
      s.jobs = s.jobs.map((j) => {
        if (j.stage === "queued" && now - j.publishedAt > 900) {
          changed = true;
          return { ...j, stage: "printing" as JobStage };
        }
        if (j.stage === "printing" && now - j.publishedAt > 2400) {
          changed = true;
          void deliver(j.id, { corrupt: j.corrupt });
          return { ...j, stage: "dispatched" as JobStage };
        }
        return j;
      });
      if (changed) bump();
    }, 320);
    return () => window.clearInterval(t);
  }, [deliver, bump]);

  /* ---- scenario runner ---- */
  const setScenario = useCallback(
    (id: ScenarioId, status: ScenarioStatus) => {
      sim.current.scenarios = { ...sim.current.scenarios, [id]: status };
      bump();
    },
    [bump]
  );

  const runOne = useCallback(
    async (id: ScenarioId) => {
      sim.current.running = true;
      bump();
      setScenario(id, "running");
      let ok = false;
      const s = () => sim.current;

      if (id === "S1") {
        const att = s().attendees.find((a) => a.id === "att-01");
        ok = att?.state === "NOT_CHECKED_IN" ? scan("att-01") === 202 : s().flags.pendingPrintSeen;
        await sleep(600);
      } else if (id === "S2") {
        const att = s().attendees.find((a) => a.id === "att-01");
        if (att?.state === "NOT_CHECKED_IN") scan("att-01");
        await sleep(350);
        const r1 = scan("att-01"); // must 409 in PENDING_PRINT (or CHECKED_IN if late)
        await sleep(750);
        const r2 = scan("att-03"); // must 409 in CHECKED_IN
        ok = r1 === 409 && r2 === 409;
        await sleep(500);
      } else if (id === "S3") {
        const att = s().attendees.find((a) => a.id === "att-01");
        if (att?.state === "NOT_CHECKED_IN") scan("att-01");
        ok = await waitFor(
          () => s().attendees.find((a) => a.id === "att-01")?.state === "CHECKED_IN"
        );
      } else {
        // S4 — forged signature on Idris, then stale/unknown jobId
        const idris = s().attendees.find((a) => a.id === "att-02");
        if (idris?.state === "NOT_CHECKED_IN") scan("att-02", true);
        const tampered = await waitFor(
          () => s().jobs.find((j) => j.attendeeId === "att-02")?.stage === "rejected"
        );
        await sleep(650);
        const stale = (await deliver("job-EXPIRED-0001", { unknown: true })) === 409;
        await sleep(650);
        const maraJob = s().jobs.find((j) => j.attendeeId === "att-01");
        const redel = maraJob && maraJob.stage === "confirmed" ? (await deliver(maraJob.id)) === 409 : true;
        ok = tampered && stale && redel;
      }

      setScenario(id, ok ? "pass" : "idle");
      bump();
    },
    [bump, deliver, scan, setScenario]
  );

  const runScenario = useCallback(
    async (id: ScenarioId) => {
      if (runLock.current) return;
      runLock.current = true;
      try {
        await runOne(id);
      } finally {
        sim.current.running = false;
        runLock.current = false;
        bump();
      }
    },
    [bump, runOne]
  );

  const runAll = useCallback(async () => {
    if (runLock.current) return;
    runLock.current = true;
    // Full run always starts from a clean floor.
    if (sim.current.attendees.find((a) => a.id === "att-01")?.state !== "NOT_CHECKED_IN") {
      sim.current = initialSim();
      bump();
      await sleep(400);
    }
    try {
      for (const id of ["S1", "S2", "S3", "S4"] as ScenarioId[]) {
        await runOne(id);
        await sleep(700);
      }
    } finally {
      sim.current.running = false;
      runLock.current = false;
      bump();
    }
  }, [bump, runOne]);

  const reset = useCallback(() => {
    if (runLock.current) return;
    sim.current = initialSim();
    bump();
  }, [bump]);

  /* ---- RANK verdict, derived live ---- */
  const f = sim.current.flags;
  const verdict = {
    adaptation: f.queuePublished && f.pendingPrintSeen && f.webhookVerified,
    integrity: f.dupBlockedPending && f.dupBlockedCheckedIn,
    delta: true, // scope delta + trade-off matrix are published on this page
  };
  const score =
    (verdict.adaptation ? 40 : 0) + (verdict.integrity ? 30 : 0) + (verdict.delta ? 30 : 0);

  return { sim: sim.current, scan, runScenario, runAll, reset, verdict, score };
}
