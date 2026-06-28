// Cloudflare Pages _worker.js — підхоплюється навіть при drag-and-drop deploy
const NBU = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/rates") {
      try {
        const r = await fetch(NBU, { cf: { cacheTtl: 3600, cacheEverything: true } });
        const body = await r.text();
        return new Response(body, {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=3600"
          }
        });
      } catch (e) {
        return new Response("[]", { status: 502, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
