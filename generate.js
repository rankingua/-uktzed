#!/usr/bin/env node
/*
 * ГЕНЕРАТОР САЙТУ-ДОВІДНИКА УКТЗЕД
 * ────────────────────────────────
 * Що робить: читає data/tovary.json і автоматично створює в папці dist/
 *   - головну сторінку (index.html) з пошуком, розбором коду й каталогом
 *   - окрему сторінку на КОЖЕН товар з файлу даних
 *   - sitemap.xml для Google
 *
 * Як запустити:  node generate.js
 * Як додати товар: відкрий data/tovary.json, додай рядок у "tovary", знову запусти.
 *
 * Жодних бібліотек не треба — працює на чистому Node.
 */

const fs = require("fs");
const path = require("path");

// ── СТИЛІ (спільні для всіх сторінок) ──
const CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;color:#1a2230;background:#f6f8fb;line-height:1.6}
.site-head{background:#fff;border-bottom:1px solid #e3e9f0;padding:14px 20px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.logo{font-weight:700;font-size:18px;color:#1a4fa0;text-decoration:none}
.logo-sub{font-size:13px;color:#6b7a8d}
.wrap{max-width:860px;margin:0 auto;padding:26px 18px 60px}
.sec{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#8090a3;margin:30px 0 14px}
.hero{background:#fff;border:1px solid #e3e9f0;border-radius:16px;padding:26px 22px}
.hero h1{font-size:26px;margin:0 0 8px}
.hero p{color:#5a6a7d;margin:0 0 18px}
.searchrow{display:flex;gap:8px;margin-bottom:14px}
.searchrow input{flex:1;padding:11px 13px;border:1px solid #cdd7e3;border-radius:9px;font-size:15px}
.searchrow button{padding:11px 20px;background:#1a4fa0;color:#fff;border:none;border-radius:9px;font-size:15px;cursor:pointer;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{font-size:13px;background:#f1f5fa;border:1px solid #dce5ef;border-radius:8px;padding:6px 11px;text-decoration:none;color:#33455c}
.chip:hover{border-color:#1a4fa0;color:#1a4fa0}
.search-results{margin-top:12px}
.sr-item{display:flex;justify-content:space-between;padding:9px 11px;border:1px solid #e3e9f0;border-radius:8px;margin-bottom:6px;text-decoration:none;color:#1a2230;font-size:14px}
.sr-item span{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#1a4fa0}
.sr-item:hover{border-color:#1a4fa0}
.sr-empty{color:#8090a3;font-size:14px;padding:8px}
.code-explainer{background:#fff;border:1px solid #e3e9f0;border-radius:16px;padding:20px 22px;margin-top:18px}
.codebox{display:flex;gap:5px;flex-wrap:wrap;margin:4px 0 14px}
.pair{text-align:center;cursor:pointer}
.digits{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:25px;font-weight:600;letter-spacing:2px;padding:8px 11px;border:1px solid #cdd7e3;border-radius:9px}
.pair.on .digits{border:2px solid #1a4fa0;color:#1a4fa0}
.plab{font-size:10px;color:#8090a3;margin-top:5px;max-width:66px;line-height:1.25}
.code-expl{background:#f1f5fa;border-radius:9px;padding:12px 14px;font-size:14px;min-height:40px}
.tgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px}
.tcard{display:flex;flex-direction:column;gap:3px;background:#fff;border:1px solid #e3e9f0;border-radius:11px;padding:13px 14px;text-decoration:none;color:#1a2230}
.tcard:hover{border-color:#1a4fa0}
.tcard-name{font-weight:600;font-size:14px}
.tcard-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#8090a3}
.risk{background:#fff6e6;border:1px solid #f5d99a;border-radius:11px;padding:12px 15px;font-size:14px;color:#7a5a14;margin-top:18px}
.crumbs{font-size:13px;color:#8090a3;margin-bottom:14px}
.crumbs a{color:#1a4fa0;text-decoration:none}
article{background:#fff;border:1px solid #e3e9f0;border-radius:16px;padding:26px 24px}
article h1{font-size:25px;margin:0 0 14px}
article h2{font-size:19px;margin:26px 0 10px}
article h3{font-size:15px;margin:14px 0 5px}
.lead{font-size:16px;background:#f1f5fa;border-radius:10px;padding:14px 16px}
.kod{font-family:ui-monospace,Menlo,Consolas,monospace;color:#1a4fa0}
table.data{width:100%;border-collapse:collapse;font-size:14px}
table.data td{padding:9px 10px;border-bottom:1px solid #eef2f7}
table.data td:first-child{color:#5a6a7d;width:46%}
.disclaimer{font-size:13px;color:#7a5a14;background:#fff6e6;border-radius:9px;padding:11px 13px;margin-top:14px}
.mistakes li,.related li{margin-bottom:7px}
.related a{color:#1a4fa0}
.faq-item h3{color:#1a2230}
.faq-item p{margin:0 0 4px;color:#3a4a5d}
.site-foot{border-top:1px solid #e3e9f0;background:#fff;padding:20px;margin-top:40px}
.site-foot p{max-width:860px;margin:0 auto;font-size:12px;color:#8090a3}
`;

const ROOT = __dirname;
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "tovary.json"), "utf8"));
const OUT = path.join(ROOT, "dist");
const { site, tovary } = DATA;

// ── допоміжне: екранування й спільні шматки ──
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Спільний <head> для всіх сторінок: мета-теги, og, стилі
function head(title, description, canonical) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<style>${CSS}</style>
</head>
<body>
<header class="site-head">
  <a href="/" class="logo">${esc(site.name)}</a>
  <span class="logo-sub">${esc(site.tagline)}</span>
</header>
<main class="wrap">`;
}

const foot = `</main>
<footer class="site-foot">
  <p>${esc(site.name)} — довідковий ресурс. Дані про мито та ПДВ можуть змінюватися; перед декларуванням звіряйте з чинним Митним тарифом України. Матеріали не є класифікаційним рішенням митниці.</p>
</footer>
</body>
</html>`;

// ── ГОЛОВНА СТОРІНКА ──
function buildIndex() {
  const chips = tovary.map(t =>
    `<a class="chip" href="/${t.slug}/">${esc(t.nazva)}</a>`).join("");

  const cards = tovary.map(t => `
    <a class="tcard" href="/${t.slug}/">
      <span class="tcard-name">${esc(t.nazva)}</span>
      <span class="tcard-code">${esc(t.kod)}</span>
    </a>`).join("");

  // інтерактивний розбір коду — той самий, що в прототипі
  const codeDemo = `
  <section class="code-explainer">
    <h2 class="sec">Як читається код — натисніть на пару цифр</h2>
    <div class="codebox" id="codebox"></div>
    <div class="code-expl" id="codeExpl">Натисніть будь-яку пару цифр, щоб дізнатись, що вона означає.</div>
  </section>`;

  const body = head(
    `${site.name} — ${site.tagline}`,
    `Знайдіть код УКТЗЕД свого товару: ставка мита, ПДВ і документи для розмитнення. Просто й зрозуміло.`,
    site.domain + "/"
  ) + `
  <section class="hero">
    <h1>Знайдіть код УКТЗЕД свого товару</h1>
    <p>Введіть назву товару — отримайте код, ставку мита, ПДВ і перелік документів для розмитнення. Зрозуміло, без бюрократичної мови.</p>
    <div class="searchrow">
      <input type="text" id="q" placeholder="Напр.: навушники, кросівки, сонячні панелі…" autocomplete="off">
      <button id="searchBtn">Знайти</button>
    </div>
    <div class="chips">${chips}</div>
    <div class="search-results" id="searchResults"></div>
  </section>

  ${codeDemo}

  <section>
    <h2 class="sec">Популярні товари</h2>
    <div class="tgrid">${cards}</div>
  </section>

  <div class="risk"><strong>Товари групи ризику</strong> — навушники, взуття, годинники, БАДи найчастіше декларують з помилкою. Ціна помилки: штраф і затримка вантажу.</div>
  ` + foot;

  // дані для клієнтського пошуку (вбудовуємо просто масив)
  const searchData = tovary.map(t => ({ n: t.nazva, s: t.slug, k: t.kod }));
  const script = `
<script>
const PAIRS=[["85","Група","Загальна категорія товару (84–85 — машини, електротехніка)"],["18","Товарна позиція","Уточнює групу: 8518 — мікрофони, гучномовці, навушники"],["30","Підпозиція","Деталізація на рівні Гармонізованої системи"],["00","Категорія","Національне уточнення України (7–8 цифри)"],["00","Підкатегорія","Статистичний рівень для звітності (9–10 цифри)"]];
const cb=document.getElementById("codebox"),ce=document.getElementById("codeExpl");
PAIRS.forEach((p,i)=>{const d=document.createElement("div");d.className="pair"+(i===0?" on":"");d.innerHTML='<div class="digits">'+p[0]+'</div><div class="plab">'+p[1]+'</div>';d.onclick=function(){[].forEach.call(cb.children,c=>c.classList.remove("on"));d.classList.add("on");ce.innerHTML='<strong>'+p[0]+' — '+p[1]+'.</strong> '+p[2]};cb.appendChild(d)});
ce.innerHTML='<strong>85 — Група.</strong> '+PAIRS[0][2];
const SD=${JSON.stringify(searchData)};
const q=document.getElementById("q"),sr=document.getElementById("searchResults");
function doSearch(){const v=q.value.trim().toLowerCase();if(!v){sr.innerHTML="";return}
  const hits=SD.filter(x=>x.n.toLowerCase().includes(v));
  sr.innerHTML=hits.length?hits.map(h=>'<a class="sr-item" href="/'+h.s+'/">'+h.n+' <span>'+h.k+'</span></a>').join(""):'<div class="sr-empty">Нічого не знайдено. Спробуйте іншу назву або перегляньте каталог нижче.</div>';}
q.addEventListener("input",doSearch);
document.getElementById("searchBtn").onclick=doSearch;
</script>`;

  fs.writeFileSync(path.join(OUT, "index.html"), body + script);
}

// ── ТОВАРНА СТОРІНКА ──
function buildTovar(t) {
  const canonical = `${site.domain}/${t.slug}/`;
  const title = `${t.h1} — мито, ПДВ, документи`;
  const desc = `Який код УКТЗЕД у «${t.nazva}»: ставка мита ${t.myto}%, ПДВ ${t.pdv}%, документи для розмитнення та типові помилки класифікації.`;

  const pomylky = t.pomylky.map(p => `<li>${esc(p)}</li>`).join("");
  const sumizhni = t.sumizhni.map(s =>
    `<li><a href="/${s.slug}/">${esc(s.nazva)}</a> — код ${esc(s.kod)}</li>`).join("");
  const faqHtml = t.faq.map(f =>
    `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("");

  // JSON-LD: FAQPage + Article — для featured snippets і E-E-A-T
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: t.faq.map(f => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
  const articleLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: t.h1, datePublished: "2026-06-15", dateModified: "2026-06-15",
    author: { "@type": "Organization", name: site.name }
  };

  const body = head(title, desc, canonical) + `
  <nav class="crumbs"><a href="/">Головна</a> → ${esc(t.nazva)}</nav>
  <article>
    <h1>${esc(t.h1)}</h1>
    <p class="lead"><strong>${esc(t.nazva)}</strong> класифікується за кодом УКТЗЕД <strong class="kod">${esc(t.kod)}</strong>. Ставка ввізного мита — ${esc(t.myto)}%, ПДВ — ${esc(t.pdv)}%.</p>

    <h2>Код, мито та податки</h2>
    <table class="data">
      <tr><td>Код УКТЗЕД</td><td><strong>${esc(t.kod)}</strong></td></tr>
      <tr><td>Опис позиції</td><td>${esc(t.opys_pozytsii)}</td></tr>
      <tr><td>Ввізне мито (загальна)</td><td>${esc(t.myto)}%</td></tr>
      <tr><td>Ввізне мито (ЄС / пільга)</td><td>${esc(t.myto_es)}%</td></tr>
      <tr><td>ПДВ</td><td>${esc(t.pdv)}%</td></tr>
      <tr><td>Акциз</td><td>${esc(t.akcyz)}</td></tr>
      <tr><td>Дозвільні документи</td><td>${esc(t.dokumenty)}</td></tr>
    </table>
    <p class="disclaimer">⚠️ Ставки наведено станом на ${esc(t.data_pereviRky)}. Митний тариф періодично змінюється — звіряйте з чинним Митним тарифом України. Стаття має довідковий характер і не є класифікаційним рішенням митниці.</p>

    <h2>Як визначається код для «${esc(t.nazva)}»</h2>
    <p>${esc(t.yak_vyznachaietsia)}</p>

    <h2>Типові помилки класифікації</h2>
    <ul class="mistakes">${pomylky}</ul>

    <h2>Схожі товари та суміжні коди</h2>
    <ul class="related">${sumizhni}</ul>

    <h2>Які документи потрібні для розмитнення</h2>
    <p>${esc(t.dokumenty)}</p>

    <h2>Питання й відповіді</h2>
    ${faqHtml}
  </article>
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <script type="application/ld+json">${JSON.stringify(articleLd)}</script>
  ` + foot;

  const dir = path.join(OUT, t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

// ── SITEMAP ──
function buildSitemap() {
  const urls = ["", ...tovary.map(t => t.slug + "/")];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.domain}/${u}</loc></url>`).join("\n")}
</urlset>`;
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), xml);
}

// ── ЗАПУСК ──
fs.mkdirSync(OUT, { recursive: true });
buildIndex();
tovary.forEach(buildTovar);
buildSitemap();
console.log(`✓ Готово. Згенеровано сторінок: ${tovary.length + 1} (головна + ${tovary.length} товарних)`);
console.log(`✓ Створено sitemap.xml`);
console.log(`✓ Усе лежить у папці dist/`);

