// Cloudflare Worker – relays TGJU currency rates to the website (adds CORS, caches 2 min).
// No secrets are used or stored here. Deploy: Cloudflare dashboard > Workers & Pages > Create > paste > Deploy.
//
// SECURITY: only these origins may read the data from a browser.
// When the real domain is live, add it here (and keep the github.io one while it is still used).
const ALLOWED_ORIGINS = [
  "https://travel4iran.github.io",
  // "https://www.example.com",
];
const UPSTREAM = "https://tgju.amirhossein.info/api/price/currency"; // the ONLY URL this worker will fetch

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);
    // Browsers always send Origin on cross-site requests; a wrong one is rejected.
    // Requests with no Origin (opening the worker URL directly to test) are still served, without CORS headers.
    if (origin && !allowed) return new Response("Forbidden", { status: 403 });

    const cors = {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    };
    if (allowed) cors["Access-Control-Allow-Origin"] = origin;

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: cors });

    const json = { ...cors, "Content-Type": "application/json; charset=utf-8" };
    try {
      const r = await fetch(UPSTREAM, { headers: { Accept: "application/json" }, cf: { cacheTtl: 120, cacheEverything: true } });
      if (!r.ok) return new Response(JSON.stringify({ error: "upstream " + r.status }), { status: 502, headers: json });
      const body = await r.text();
      // never relay something that is not JSON (e.g. an HTML error page from the upstream)
      try { JSON.parse(body); } catch (_) {
        return new Response(JSON.stringify({ error: "bad upstream" }), { status: 502, headers: json });
      }
      return new Response(body, { headers: { ...json, "Cache-Control": "public, max-age=120" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "fetch failed" }), { status: 502, headers: json });
    }
  },
};
