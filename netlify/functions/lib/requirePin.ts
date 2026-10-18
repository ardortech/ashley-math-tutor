import { timingSafeEqual } from "crypto";

export interface PinResult {
  ok: boolean;
  response?: Response;
}

export function requirePin(request: Request): PinResult {
  const expected = process.env.APP_PIN;

  // Fail closed: if APP_PIN is not configured, reject all requests
  if (!expected) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "PIN not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const pin = request.headers.get("x-app-pin") ?? "";

  // Constant-time comparison: pad both to the same length
  const maxLen = Math.max(expected.length, pin.length, 1);
  const a = Buffer.alloc(maxLen, 0);
  const b = Buffer.alloc(maxLen, 0);
  a.write(expected);
  b.write(pin);

  const match = expected.length === pin.length && timingSafeEqual(a, b);

  if (!match) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true };
}
