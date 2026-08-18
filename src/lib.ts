/* Shared utilities: real HMAC-SHA256 via WebCrypto with a clearly
   labelled fallback for non-secure contexts. */

const enc = new TextEncoder();

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 13);
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
}

/* cyrb53 — fast non-crypto hash, used only to produce a deterministic
   64-char digest when WebCrypto is unavailable (labelled in the UI). */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function demoDigest(msg: string): string {
  let out = "";
  for (let seed = 0; seed < 4; seed++) {
    out += cyrb53(msg, seed).toString(16).padStart(14, "0");
  }
  return out.slice(0, 64);
}

export async function hmacHex(
  secret: string,
  message: string
): Promise<{ hex: string; real: boolean }> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return { hex, real: true };
    }
  } catch {
    /* fall through to demo digest */
  }
  return { hex: demoDigest(message + "::" + secret), real: false };
}

export function shortHex(hex: string, n = 10): string {
  return hex.length <= n * 2 + 1 ? hex : hex.slice(0, n) + "…" + hex.slice(-4);
}

export function clockTime(d = new Date()): string {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}
