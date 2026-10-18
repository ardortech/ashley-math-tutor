import { getStore } from "@netlify/blobs";

const MAX_CALLS = 60;
const WINDOW_MS = 60 * 60 * 1000;

interface RateBucket {
  timestamps: number[];
}

export interface RateLimitResult {
  ok: boolean;
  response?: Response;
}

export async function checkRateLimit(request: Request): Promise<RateLimitResult> {
  const deviceId = request.headers.get("x-device-id") ?? "unknown";
  const store = getStore("rate-limits");
  const key = `device:${deviceId}`;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let bucket: RateBucket = { timestamps: [] };
  try {
    const raw = await store.get(key);
    if (raw) {
      bucket = JSON.parse(raw) as RateBucket;
    }
  } catch {
    // treat as empty
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= MAX_CALLS) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "今天問好多題了，休息一下再來！" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  bucket.timestamps.push(now);
  try {
    await store.set(key, JSON.stringify(bucket));
  } catch {
    // non-fatal
  }

  return { ok: true };
}
