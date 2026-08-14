export const COMMIT = {
  sha: "a41f9c2",
  branch: "feat/live-dashboard",
  base: "main",
  author: "Ava Chen <ava@northstar.dev>",
  date: "Fri Feb 20 17:42:08 2026 +0100",
  subject:
    "feat(dashboard): add live deflection metrics and rewire UI event handlers",
  body: `Render the agent dashboard from live state: a 7-day deflected-vs-escalated
trend chart and a rolling 24-point sparkline as inline SVG, a donut gauge
for deflection rate, category-volume bars, and a channel-performance
breakdown — all recomputed by renderMetrics().

Add liveTick(), a 5-second feed simulator that classifies inbound
chat/self-serve events as deflected (68%) or escalated, appends each to
the inquiry log, and refreshes every chart and counter. A toggle pauses
and resumes the feed with toast feedback, and an agent simulator injects
auto-tagged tickets into the triage queue.

Re-wire interactions: tab switching via querySelectorAll with null-safe
pane activation (metrics re-render on return to the dashboard tab), the
chat form and quick-reply chips routed through handleUser(), self-serve
track/return/stock actions, product→size population, and tile search.

On load: seed the product select, render all views, and post the welcome
bot message with its quick-action menu after 300ms.`,
};

export const fullMessage = `${COMMIT.subject}\n\n${COMMIT.body}`;

export const DIFFSTAT = {
  files: "1 file changed",
  path: "index.html",
  added: 118,
  removed: 7,
  cells: ["add", "add", "add", "add", "del"] as const,
};

export type Module = {
  n: string;
  title: string;
  color: "sky" | "teal" | "amber" | "rose";
  fns: string[];
  desc: string;
};

export const MODULES: Module[] = [
  {
    n: "01",
    title: "Dashboard renderers",
    color: "sky",
    fns: ["renderTrend", "renderSpark", "renderLog", "renderMetrics"],
    desc: "Builds every chart as an SVG string: gridlines, area fill, polylines, and data dots carrying <title> tooltips. Trend axes clamp to a ceil-to-10 max with a floor of 10; the sparkline keeps a 24-sample rolling window ending in a pulsing “now” dot; the deflection donut is a stroke-dashoffset gauge on an r=51 circle, where rate = (solved + auto) ÷ total.",
  },
  {
    n: "02",
    title: "Live feed engine",
    color: "teal",
    fns: ["liveTick", "setInterval 5000"],
    desc: "Every 5 seconds, simulates 1–3 inbound events across order / return / stock intents on Chat or Self-serve (50/50). Each resolves as deflected (68%) or escalated, bumps category volumes, appends to the inquiry log, pushes a fresh sparkline sample (trimmed to 24), and re-stamps “Updated hh:mm:ss”.",
  },
  {
    n: "03",
    title: "Event wiring — flagged “(fixed)”",
    color: "amber",
    fns: ["tabs", "chatForm", "chip-q", "ssTrack", "ssReturn", "ssStock", "agSim", "liveToggle"],
    desc: "Rebinds every interaction: tab switching rebuilt on querySelectorAll with null-safe pane activation, chat submit plus quick-reply chips funnelled through handleUser(), the three self-serve flows, product→size population, live tile search, the ticket simulator, and the feed pause/resume toggle.",
  },
  {
    n: "04",
    title: "Bootstrap sequence",
    color: "rose",
    fns: ["init"],
    desc: "Seeds the product <select> from PRODUCTS, renders tiles / tickets / metrics / log, stamps the clock, starts the 5-second interval, and posts the welcome bot message with a quick-action menu after a 300ms beat.",
  },
];

export const RAIL_STATS = [
  { k: "functions in view", v: "12" },
  { k: "SVG charts rebuilt per tick", v: "3" },
  { k: "interval", v: "1 × 5s" },
  { k: "sparkline window", v: "24 pts" },
  { k: "deflection split", v: "68 / 32" },
];

export type Signal = {
  tag: "hint" | "note" | "caution";
  title: string;
  body: string;
};

export const SIGNALS: Signal[] = [
  {
    tag: "hint",
    title: "The commit type is hiding in the comments",
    body: "The /* WIRING (fixed) */ banner is the strongest signal in the diff: part of this change repairs handler binding — almost certainly after a DOM refactor that broke the $() lookups. That's why the subject leads with “rewire” and a fix-flavoured alternate sits below.",
  },
  {
    tag: "note",
    title: "ES5, single file, no build step",
    body: "var, function declarations, string-built SVG. This is a no-framework HTML app, so the message is scoped to (dashboard) and makes zero claims about tooling, modules, or tests.",
  },
  {
    tag: "note",
    title: "innerHTML on a 5-second heartbeat",
    body: "Each tick rebuilds chart and log markup via innerHTML — harmless at this scale, and esc() sanitises the user-supplied strings that reach the log. The body stays honest about the mechanism instead of dressing it up.",
  },
  {
    tag: "caution",
    title: "Two runtime notes worth a follow-up",
    body: "Math.max.apply(null, s) returns −∞ if LIVE_SERIES is ever empty, and the setInterval is never cleared — fine for a standalone demo page, leaky the day this gets mounted inside an SPA. Neither blocks the commit; both deserve a TODO.",
  },
  {
    tag: "note",
    title: "Constants live upstream of this hunk",
    body: "TREND, MET, INQ, SIM, PRODUCTS, tickets and helpers ($, pick, toast, handleUser, botSay…) are declared earlier in the same script. This snippet is the tail of one file — hence “1 file changed” in the diffstat.",
  },
];

export type AltStyle = {
  id: string;
  label: string;
  hint: string;
  lines: string[];
};

export const ALTERNATES: AltStyle[] = [
  {
    id: "oneline",
    label: "One-liner",
    hint: "For teams that keep history shallow and subjects under 72 chars.",
    lines: [
      "feat: live deflection dashboard with simulated feed and repaired event wiring",
    ],
  },
  {
    id: "fix",
    label: "Fix-flavoured",
    hint: "Use this if the wiring repair — not the dashboard — is why the change exists.",
    lines: [
      "fix(ui): rebind tab, chat, and self-serve handlers; guard dashboard renders",
      "",
      "Wiring is rebuilt around querySelectorAll with null-safe pane activation,",
      "and renderMetrics() is re-invoked on tab focus so charts never show stale",
      "state after the DOM refactor.",
    ],
  },
  {
    id: "release",
    label: "Release note",
    hint: "Customer-facing wording, if this demo ships to stakeholders.",
    lines: [
      "- New live dashboard: 7-day trend, rolling sparkline, deflection donut",
      "- Simulated inbound feed every 5s with pause/resume control",
      "- Auto-tagging ticket simulator for the agent triage queue",
      "- Fixed tab switching and form handler wiring",
    ],
  },
];

export const TAGS = [
  "dashboard",
  "live-feed",
  "svg-charts",
  "wiring-fix",
  "vanilla-js",
  "es5",
];
