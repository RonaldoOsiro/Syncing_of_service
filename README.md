# Northstar Sync

Verified inventory webhooks for Northstar Retail Co. — every stock count the
support desk quotes is HMAC-SHA256 signed, replay-proof, and fresh to the
second. Built during days 1–2 of the **Meridian Pivot** sprint.

## What's inside

| Path       | What it is                                                     |
| ---------- | -------------------------------------------------------------- |
| `/` (root) | The product site — React + Vite + Tailwind portfolio piece     |
| `server/`  | The working Express prototype: signature verification service  |
| `netlify.toml`, `vercel.json`, `render.yaml` | One-command deploy configs |

## The security model (in one breath)

The supplier signs `"<timestamp>.<nonce>.<raw body>"` with a shared secret
(HMAC-SHA256, hex). The service verifies against the **raw bytes** captured in
`express.json({ verify })`, compares in constant time (length-guarded before
`timingSafeEqual`), rejects anything older than 5 minutes, and consumes each
nonce exactly once — so tampering, forgery, staleness, and replay all bounce.

## Run it locally

```bash
# --- the site ---
npm install
npm run dev              # http://localhost:5173
npm run build            # emits dist/

# --- the prototype ---
cd server
cp .env.example .env
npm install
npm run dev              # listens on :3000

# supplier-side test signer
WEBHOOK_SECRET=meridian-dev-secret ./send.sh                # -> 200
WEBHOOK_SECRET=meridian-dev-secret ./send.sh --tamper       # -> 401
WEBHOOK_SECRET=meridian-dev-secret ./send.sh --stale        # -> 400
WEBHOOK_SECRET=meridian-dev-secret ./send.sh --replay       # -> 409 (2nd run)
curl http://localhost:3000/inventory/NS-1042                # read live stock
```

## Deploy

```bash
# site (pick one)
npx vercel --prod
npx netlify-cli deploy --prod --dir=dist

# api (pick one)
cd server && fly launch --copy-config && fly deploy \
  && fly secrets set WEBHOOK_SECRET="$(openssl rand -hex 32)"
# or: push this repo and create a Blueprint Instance in Render (render.yaml)

# prove it live
BASE=https://<your-api-url> WEBHOOK_SECRET=<same secret> ./server/send.sh
```

## Commit convention

`<type>: <what changed> - <why it matters>` — e.g.
`fix(server): guard timingSafeEqual lengths - forged sigs can no longer throw`
