import type { Context } from "@netlify/functions";
import { requirePin } from "./lib/requirePin";

export default async function handler(request: Request, _context: Context) {
  const pin = requirePin(request);
  if (!pin.ok) return pin.response!;

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
