// Cloudflare Worker – relays TGJU currency rates to the website (adds CORS, caches 2 min).
// No secrets are used or stored here. Deploy: Cloudflare dashboard > Workers & Pages > Create > paste > Deploy.
//
// SECURITY: once your real domain is known, put it in ALLOWED_ORIGINS so only your site can read the data.
//   example: const ALLOWED_ORIGINS = ["https://travelamin.com", "https://www.travelamin.com"];
const ALLOWED_ORIGINS = [];
const UPSTREAM = "https://tgju.amirhossein.info/api/price/currency"; // the ONLY URL this worker will fetch

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const restricted = ALLOWED_ORIGINS.length > 0;
    if (restricted && origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    const cors = {
      "Access-Control-Allow-Origin": restricted ? (origin || ALLOWED_ORIGINS[0]) : "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: cors });
    const json = { ...cors, "Content-Type": "application/json; charset=utf-8" };
    try {
      const r = await fetch(UPSTREAM, { headers: { Accept: "application/json" }, cf: { cacheTtl: 120, cacheEverything: true } });
      if (!r.ok) return new Response(JSON.stringify({ error: "upstream " + r.status }), { status: 502, headers: json });
      return new Response(await r.text(), { headers: { ...json, "Cache-Control": "public, max-age=120" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "fetch failed" }), { status: 502, headers: json });
    }
  },
};
