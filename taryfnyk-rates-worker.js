// ───────────────────────────────────────────────────────────────
// Cloudflare Worker: проксі курсів НБУ для калькулятора Тарифник
// Створюється ОКРЕМО від сайту, через веб-редактор Cloudflare.
// Віддає курси НБУ з боку сервера — обходить CORS і VPN-обмеження.
// ───────────────────────────────────────────────────────────────

const NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";

export default {
  async fetch(request) {
    // дозволяємо лише GET
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "*"
        }
      });
    }

    try {
      // запит до НБУ з кешуванням на годину (курси оновлюються раз на день)
      const resp = await fetch(NBU_URL, {
        cf: { cacheTtl: 3600, cacheEverything: true }
      });

      if (!resp.ok) throw new Error("NBU bad status");

      const body = await resp.text();

      return new Response(body, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*",
          "cache-control": "public, max-age=3600"
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "NBU unavailable" }), {
        status: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      });
    }
  }
};
