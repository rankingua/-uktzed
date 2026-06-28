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
const { buildBlog, blogUrls, BLOG_SLUG } = require("./blog.js");

// ── СТИЛІ (спільні для всіх сторінок) ──
const CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,system-ui,sans-serif;color:#1a2230;background:#f6f8fb;line-height:1.6}
.site-head{background:#1a4fa0;border-bottom:1px solid #163f80;padding:14px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.logo{display:inline-flex;align-items:center;gap:9px;font-weight:700;font-size:18px;color:#fff;text-decoration:none}
.logo-bars{display:inline-flex;align-items:flex-end;gap:2px;height:22px}
.logo-bars i{display:block;width:2px;height:22px;background:#fff;border-radius:1px}
.logo-sub{font-size:13px;color:#c5d6f0;align-self:center}
.wrap{max-width:860px;margin:0 auto;padding:26px 18px 60px}
.sec{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#8090a3;margin:30px 0 14px}
.blog-h2{font-size:22px;font-weight:700;color:#0f1b2d;margin:34px 0 14px;padding-bottom:8px;border-bottom:2px solid #eef1f5;line-height:1.3}
.sec-sub{font-size:14px;color:#5a6a7d;margin:-8px 0 16px}
.bgrid{display:grid;gap:14px;margin-top:18px}
.bcard{display:block;background:#fff;border:1px solid #e3e9f0;border-radius:12px;padding:18px 20px;text-decoration:none;transition:box-shadow .15s}
.bcard:hover{box-shadow:0 4px 16px rgba(26,79,160,.1)}
.bcard-title{display:block;font-size:18px;font-weight:600;color:#1a4fa0;margin-bottom:6px}
.bcard-desc{display:block;font-size:14px;color:#5a6a7d;line-height:1.5}
.blog-article ol,.blog-article ul{padding-left:22px;line-height:1.7}
.blog-article li{margin-bottom:6px}
.blog-cta{background:#eef3fb;border-left:3px solid #1a4fa0;border-radius:8px;padding:14px 16px;margin:18px 0;font-size:15px}
.blog-figure{margin:22px 0;padding:18px;background:#f8fafc;border:1px solid #e8edf3;border-radius:12px}
.blog-figure figcaption{margin-top:10px;font-size:13px;color:#5a6a7d;text-align:center;line-height:1.5}
.blog-disclaimer{margin-top:30px;padding:14px 16px;background:#fff6e6;border-radius:8px;font-size:13px;color:#7a5a14;line-height:1.5}
.related-links{padding-left:22px}
.related-links a{color:#1a4fa0}
.source-links{padding-left:22px;font-size:14px}
.source-links a{color:#1a4fa0;word-break:break-word}
.source-links li{margin-bottom:6px;color:#5a6a7d}
.hero{background:#fff;border:1px solid #e3e9f0;border-radius:16px;padding:26px 22px}
.hero h1{font-size:26px;margin:0 0 8px}
.hero p{color:#5a6a7d;margin:0 0 18px}
.searchrow{display:flex;gap:8px;margin-bottom:14px}
.searchrow input{flex:1;padding:11px 13px;border:1px solid #cdd7e3;border-radius:9px;font-size:15px}
.searchrow button{padding:11px 20px;background:#1a4fa0;color:#fff;border:none;border-radius:9px;font-size:15px;cursor:pointer;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{font-size:13px;background:#f1f5fa;border:1px solid #dce5ef;border-radius:8px;padding:6px 11px;text-decoration:none;color:#33455c}
.chip:hover{border-color:#1a4fa0;color:#1a4fa0}
.search-results{margin-top:14px}
.search-results:not(:empty){margin-bottom:8px}
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
.cb-hint{font-size:13px;color:#6b7a8d;margin-bottom:10px}
.cb-note{font-size:13px;color:#8090a3;margin:12px 0 0;line-height:1.5}
.tgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px}
.tcard{display:flex;flex-direction:column;gap:3px;background:#fff;border:1px solid #e3e9f0;border-radius:11px;padding:13px 14px;text-decoration:none;color:#1a2230}
.tcard:hover{border-color:#1a4fa0}
.tcard-name{font-weight:600;font-size:14px}
.tcard-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#8090a3}
.cgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:11px}
.ccard{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid #e3e9f0;border-radius:13px;padding:16px 17px;text-decoration:none;color:#1a2230;transition:border-color .15s}
.ccard:hover{border-color:#1a4fa0}
.ccard-name{font-weight:600;font-size:16px;color:#1a4fa0}
.ccard-tag{font-size:13px;color:#5a6a7d;line-height:1.4}
.ccard-count{font-size:12px;color:#8090a3;margin-top:2px}
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
.calc{background:#f7f9fc;border:1px solid #e3e9f0;border-radius:13px;padding:18px;margin:16px 0}
.calc-row{margin-bottom:13px}
.calc-row:last-child{margin-bottom:0}
.calc-modes{display:flex;gap:8px;flex-wrap:wrap}
.calc-mode{flex:1;min-width:140px;display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #cdd7e3;border-radius:8px;padding:10px 12px;font-size:14px;color:#1a2230;font-weight:400;cursor:pointer}
.calc-mode input{width:auto;margin:0}
.calc-hint{font-size:12px;color:#5a6a7d;margin:9px 2px 0;line-height:1.45}
.calc-note{font-size:13px;color:#185fa5;background:#eef3fb;border-radius:8px;padding:9px 11px;margin-top:12px;line-height:1.45}
.calc-akciz{font-size:12.5px;color:#7a5a14;background:#fff6e6;border-radius:8px;padding:10px 12px;margin-top:12px;line-height:1.5}
.calc-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.calc label{display:block;font-size:13px;color:#5a6a7d;font-weight:500}
.calc input,.calc select{width:100%;margin-top:5px;padding:10px 11px;border:1px solid #cdd7e3;border-radius:8px;font-size:15px;color:#1a2230;background:#fff;box-sizing:border-box}
.calc-input{position:relative;margin-top:5px}
.calc-input input{margin-top:0}
.calc-cur{position:absolute;right:11px;top:50%;transform:translateY(-50%);font-size:13px;color:#8090a3;pointer-events:none}
.calc button{width:100%;padding:12px;background:#1a4fa0;color:#fff;border:none;border-radius:9px;font-size:15px;font-weight:600;cursor:pointer}
.calc button:hover{background:#163f80}
.calc-out{margin-top:16px;border-top:1px solid #e3e9f0;padding-top:14px}
.calc-line{display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;font-size:14px;color:#3a4a5d}
.calc-line small{color:#8090a3;font-size:12px}
.calc-line i{color:#8090a3;font-style:normal;font-size:12px}
.calc-line b{font-weight:600;color:#1a2230;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}
#lineThreshold b{color:#8090a3;font-weight:400}
#lineTaxable{border-bottom:1px solid #eef1f5;padding-bottom:10px}
.calc-total{border-top:1px dashed #cdd7e3;margin-top:4px;padding-top:11px}
.calc-total b{color:#1a4fa0}
.calc-grand b{color:#1a4fa0;font-size:16px}
.calc-grand{font-weight:600}
.calc-cta{display:inline-flex;align-items:center;gap:6px;background:#eef3fb;border:1px solid #cdd9ee;border-radius:9px;padding:10px 14px;text-decoration:none;color:#1a4fa0;font-weight:500;font-size:14px;margin-top:6px}
.calc-cta:hover{background:#e2ebf8}
.calc-banner-wrap{margin:34px 0}
.calc-banner{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#1a4fa0,#2563c9);border-radius:13px;padding:20px 22px;text-decoration:none;color:#fff;box-shadow:0 6px 20px rgba(26,79,160,.22)}
.calc-banner-ic{font-size:28px;line-height:1}
.calc-banner-txt{flex:1;display:flex;flex-direction:column}
.calc-banner-txt b{font-size:16px;font-weight:600}
.calc-banner-txt small{font-size:13px;color:#c5d6f0;margin-top:2px}
.calc-banner-arr{font-size:22px;color:#c5d6f0}
.calc-banner:hover{filter:brightness(1.05)}
.mistakes li,.related li{margin-bottom:7px}
.related a{color:#1a4fa0}
.faq-item h3{color:#1a2230}
.faq-item p{margin:0 0 4px;color:#3a4a5d}
.site-foot{border-top:1px solid #e3e9f0;background:#fff;padding:20px;margin-top:40px}
.site-foot p{max-width:860px;margin:0 auto;font-size:12px;color:#8090a3}
.foot-links{margin-bottom:10px!important;font-size:13px!important}
.foot-links a{color:#1a4fa0;text-decoration:none;font-weight:500}
.foot-links a:hover{text-decoration:underline}
.foot-links-sec{margin-bottom:10px!important}
.foot-links-sec a{color:#8090a3;font-weight:400}
.about-sign{margin-top:30px;padding-top:20px;border-top:1px solid #e3e9f0;font-style:italic;color:#5a6a7d;line-height:1.6}
@media (max-width:600px){
  .wrap{padding:18px 14px 48px}
  .site-head{padding:12px 14px;gap:8px}
  .logo{font-size:17px}
  .logo-sub{font-size:12px;flex-basis:100%}
  .hero h1{font-size:22px}
  article h1{font-size:21px}
  .lead{font-size:15px;padding:12px 13px}
  .digits{font-size:20px;padding:6px 8px;letter-spacing:1px}
  .plab{font-size:9px}
  table.data{font-size:13px}
  table.data td{padding:8px 8px}
  .cgrid,.tgrid{grid-template-columns:1fr 1fr}
  .ccard-name{font-size:15px}
}
@media (max-width:380px){
  .cgrid,.tgrid{grid-template-columns:1fr}
  .digits{font-size:18px}
}
`;

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");

// ── ЧИТАННЯ ДАНИХ З ПЕРЕВІРКОЮ ──
// Замість загадкових збоїв генератор пояснює помилку людською мовою.
const DATA_PATH = path.join(ROOT, "data", "tovary.json");
let DATA;
try {
  DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
} catch (e) {
  console.error("\n❌ ПОМИЛКА У ФАЙЛІ data/tovary.json — зламано структуру JSON.");
  console.error("   Найчастіша причина: зайва або пропущена кома між товарами,");
  console.error("   або незакрита дужка чи лапки.");
  console.error("\n   Технічна підказка від Node:");
  console.error("   " + e.message);
  console.error("\n   Порада: відкрий файл на jsonlint.com — він покаже точний рядок помилки.\n");
  process.exit(1);
}

const { site, tovary } = DATA;

// ── КАТЕГОРІЇ (хаби) ──
// slug категорії використовується як URL: /elektronika/ тощо.
// Порядок тут = порядок карток на головній.
const CATEGORIES = [
  { slug: "elektronika", nazva: "Електроніка", tagline: "Гаджети, комп'ютери, мережеве обладнання",
    title: "Коди УКТЗЕД на електроніку: ноутбуки, ТВ, гаджети",
    intro: "Електроніка — одна з найбільших категорій імпорту й водночас одна з найскладніших у класифікації. Тут код залежить від точної функції пристрою: телевізор відрізняється від монітора наявністю тюнера, планшет від смартфона — основною функцією, роутер від комп'ютера — призначенням. Нижче зібрані найходовіші електронні товари з кодами УКТЗЕД, ставками й поясненням, як визначається код кожного." },
  { slug: "kuhnya-dim", nazva: "Кухня й дім", tagline: "Побутова техніка для дому",
    title: "Побутова техніка для кухні й дому: коди УКТЗЕД",
    intro: "Побутова техніка для кухні й дому не має єдиного коду — кожен прилад класифікують окремо за його функцією, переважно в межах групи 85. Нагрівальні прилади (мікрохвильовки, кавомашини) йдуть в одних позиціях, прилади з двигуном (пилососи) — в інших, холодильна й кліматична техніка — у власних. Нижче — коди найпопулярніших приладів із поясненням логіки." },
  { slug: "odyag-vzuttia", nazva: "Одяг і взуття", tagline: "Текстиль, взуття, аксесуари",
    title: "Коди УКТЗЕД для одягу та взуття: мито і ПДВ",
    intro: "Одяг і взуття — «парасолькові» категорії, де код залежить від кількох ознак одночасно. Для одягу головне — трикотаж (група 61) чи тканина (група 62), тип виробу й стать. Для взуття — матеріал верху й підошви, тип і призначення. Нижче зібрані основні види одягу та взуття з поясненням, як визначити точний код." },
  { slug: "sport-igry", nazva: "Спорт, ігри та відпочинок", tagline: "Спортінвентар, іграшки, туризм",
    title: "Спорттовари, іграшки, туризм: класифікація УКТЗЕД",
    intro: "Спортивний інвентар, іграшки та ігри об'єднані в УКТЗЕД спільною групою 95, але всередині мають різні позиції. Тренажери й гантелі — спортивний інвентар (9506), іграшки — 9503, відеоігрові консолі — 9504. Окремо стоять туристичні товари: намет це текстиль (6306), а спальник — постільні речі (9404). Нижче — коди з поясненням цих відмінностей." },
  { slug: "avto", nazva: "Авто", tagline: "Транспорт, запчастини, аксесуари",
    title: "Коди УКТЗЕД для шин, автозапчастин і аксесуарів",
    intro: "Автомобільна тематика охоплює транспорт, запчастини й аксесуари — і це товари з найрізноманітнішими кодами. Велосипед і електровелосипед мають різні позиції через двигун, шини діляться на нові й вживані, а аксесуари часто класифікують не як автозапчастини, а за їхньою суттю: автокрісло це сидіння, шолом — захисний головний убір. Нижче — коди ходових авто-товарів." },
  { slug: "instrument-sad", nazva: "Інструмент і сад", tagline: "Електроінструмент, садова техніка",
    title: "Електроінструмент і садова техніка: коди УКТЗЕД",
    intro: "Електроінструмент і садова техніка — товари з двигуном, які підлягають оцінці відповідності. Ручний інструмент із вмонтованим двигуном (дрилі, бензопили) йде в позиції 8467, газонокосарки — серед косарок (8433), зварювальні апарати — 8515, генератори — 8502. Нижче — коди найпопулярнішого інструменту з поясненням класифікації." },
  { slug: "krasa-zdorovya", nazva: "Краса та здоров'я", tagline: "Косметика, парфумерія, добавки",
    title: "Коди УКТЗЕД для косметики, парфумерії та БАДів",
    intro: "Косметика, парфумерія й дієтичні добавки — товари з підвищеними вимогами до безпеки й маркування. Косметика розподілена по позиціях групи 33 залежно від типу засобу, а БАДи класифікують як харчові продукти (2106), і тут головне — не сплутати добавку з лікарським засобом. Нижче — коди з поясненням логіки й типових помилок." }
];
const CAT_BY_SLUG = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]));

// Перевірки якості даних перед генерацією
(function validate() {
  const problems = [];
  if (!site || !site.domain || !site.name) problems.push("Блок \"site\" неповний (потрібні name і domain).");
  if (!Array.isArray(tovary) || tovary.length === 0) problems.push("Масив \"tovary\" порожній або відсутній.");

  const seenSlugs = {};
  (tovary || []).forEach((t, i) => {
    const label = t.nazva || t.slug || ("товар №" + (i + 1));
    // обов'язкові поля
    ["slug", "nazva", "h1", "kod"].forEach(f => {
      if (!t[f]) problems.push(`«${label}»: відсутнє обов'язкове поле "${f}".`);
    });
    // незвірені дані
    const raw = JSON.stringify(t);
    if (raw.includes("ПЕРЕВІРИТИ")) {
      problems.push(`«${label}»: лишилось незвірене поле (ПЕРЕВІРИТИ). Звір дані перед публікацією.`);
    }
    // дублі slug
    if (t.slug) {
      if (seenSlugs[t.slug]) problems.push(`Повторюється slug "${t.slug}" — у двох товарів однакова адреса.`);
      seenSlugs[t.slug] = true;
    }
  });

  if (problems.length) {
    console.error("\n⚠️  ЗНАЙДЕНО ПРОБЛЕМИ В ДАНИХ (" + problems.length + "):\n");
    problems.forEach(p => console.error("   • " + p));
    console.error("\n   Сайт НЕ згенеровано, щоб не залити неправильні сторінки.");
    console.error("   Виправ зазначене вище у data/tovary.json і запусти знову.\n");
    process.exit(1);
  }
})();

// ── допоміжне: екранування й спільні шматки ──
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Додає "%" лише якщо значення починається з цифри (числова ставка); для текстових ("звіряйте…") лишає як є
const pct = (v) => /^\s*\d/.test(String(v)) ? esc(v) + "%" : esc(v);

// Спільний <head> для всіх сторінок: мета-теги, og, стилі
// ogType: "website" для головної, "article" для товарних
function head(title, description, canonical, ogType = "article") {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="format-detection" content="telephone=no">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="application-name" content="Тарифник">
<meta name="apple-mobile-web-app-title" content="Тарифник">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="uk_UA">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="theme-color" content="#1a4fa0">
<style>${CSS}</style>
</head>
<body>
<header class="site-head">
  <a href="/" class="logo"><span class="logo-bars"><i style="width:4px"></i><i style="width:2px"></i><i style="width:5px"></i><i style="width:2px"></i><i style="width:3px"></i><i style="width:2px"></i></span>${esc(site.name)}</a>
  <span class="logo-sub">${esc(site.tagline)}</span>
</header>
<main class="wrap">`;
}

const CALC_SLUG = "kalkulyator-mytnyh-platezhiv";
const ABOUT_SLUG = "pro-proekt";
const PRIVACY_SLUG = "polityka-konfidentsiynosti";
const TERMS_SLUG = "umovy-vykorystannya";
const foot = `</main>
<footer class="site-foot">
  <p class="foot-links"><a href="/">Головна</a> · <a href="/${CALC_SLUG}/">Калькулятор митних платежів</a> · <a href="/${BLOG_SLUG}/">Блог</a> · <a href="/${ABOUT_SLUG}/">Про проєкт</a></p>
  <p class="foot-links foot-links-sec"><a href="/${PRIVACY_SLUG}/">Політика конфіденційності</a> · <a href="/${TERMS_SLUG}/">Умови використання</a></p>
  <p>${esc(site.name)} — довідковий ресурс. Дані про мито та ПДВ можуть змінюватися; перед декларуванням звіряйте з чинним Митним тарифом України. Матеріали не є класифікаційним рішенням митниці.</p>
</footer>
</body>
</html>`;

// ── ГОЛОВНА СТОРІНКА ──
function buildIndex() {
  const catCards = CATEGORIES.map(c => {
    const n = tovary.filter(t => t.kategoria === c.slug).length;
    return `
    <a class="ccard" href="/${c.slug}/">
      <span class="ccard-name">${esc(c.nazva)}</span>
      <span class="ccard-tag">${esc(c.tagline)}</span>
      <span class="ccard-count">${n} ${n >= 5 ? "товарів" : "товари"}</span>
    </a>`;
  }).join("");

  // інтерактивний розбір коду — той самий, що в прототипі
  const codeDemo = `
  <section class="code-explainer">
    <h2 class="sec">Як читається код — натисніть на пару цифр</h2>
    <div class="codebox" id="codebox"></div>
    <div class="code-expl" id="codeExpl">Натисніть будь-яку пару цифр, щоб дізнатись, що вона означає.</div>
  </section>`;

  const body = head(
    `Тарифник — Довідник кодів УКТЗЕД з поясненнями`,
    `Знайдіть код УКТЗЕД свого товару: ставка ввізного мита, ПДВ і пояснення, як визначається код. Просто й зрозуміло.`,
    site.domain + "/",
    "website"
  ) + `
  <section class="hero">
    <h1>Знайдіть код УКТЗЕД свого товару</h1>
    <p>Введіть назву товару або код — отримайте ставку ввізного мита, ПДВ і пояснення, як визначається код. Зрозуміло, без бюрократичної мови.</p>
    <div class="searchrow">
      <input type="text" id="q" placeholder="Напр.: навушники, кросівки або 8516…" autocomplete="off">
      <button id="searchBtn">Знайти</button>
    </div>
    <div class="search-results" id="searchResults"></div>
  </section>

  <section>
    <h2 class="sec">Категорії товарів</h2>
    <p class="sec-sub">Оберіть категорію або скористайтеся пошуком вище.</p>
    <div class="cgrid">${catCards}</div>
  </section>

  <section class="calc-banner-wrap">
    <a class="calc-banner" href="/${CALC_SLUG}/">
      <span class="calc-banner-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/><line x1="8" y1="18" x2="12" y2="18"/></svg></span>
      <span class="calc-banner-txt"><b>Калькулятор митних платежів</b><small>Порахуйте мито та ПДВ за вартістю товару</small></span>
      <span class="calc-banner-arr">→</span>
    </a>
  </section>

  ${codeDemo}

  <div class="risk"><strong>Товари групи ризику</strong> — навушники, взуття, годинники, БАДи найчастіше декларують з помилкою. Ціна помилки: штраф і затримка вантажу.</div>
  ` + foot;

  // Schema для головної: WebSite (з пошуком) + Organization
  const siteLd = {
    "@context": "https://schema.org", "@type": "WebSite",
    name: site.name, url: site.domain + "/", inLanguage: "uk-UA",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: site.domain + "/?q={search_term_string}" },
      "query-input": "required name=search_term_string"
    }
  };
  const orgLd = {
    "@context": "https://schema.org", "@type": "Organization",
    name: site.name, url: site.domain + "/"
  };
  const ldScripts = `
<script type="application/ld+json">${JSON.stringify(siteLd)}</script>
<script type="application/ld+json">${JSON.stringify(orgLd)}</script>`;

  // дані для клієнтського пошуку (вбудовуємо просто масив)
  const searchData = tovary.map(t => ({ n: t.nazva, s: t.slug, k: t.kod }));
  const script = `
<script>
const PAIRS=[["85","Група","Загальна категорія товару (84–85 — машини, електротехніка)"],["18","Товарна позиція","Уточнює групу: 8518 — мікрофони, гучномовці, навушники"],["30","Підпозиція","Деталізація на рівні Гармонізованої системи"],["00","Категорія","Національне уточнення України (7–8 цифри)"],["00","Підкатегорія","Статистичний рівень для звітності (9–10 цифри)"]];
const cb=document.getElementById("codebox"),ce=document.getElementById("codeExpl");
if(cb){PAIRS.forEach((p,i)=>{const d=document.createElement("div");d.className="pair"+(i===0?" on":"");d.innerHTML='<div class="digits">'+p[0]+'</div><div class="plab">'+p[1]+'</div>';d.onclick=function(){[].forEach.call(cb.children,c=>c.classList.remove("on"));d.classList.add("on");ce.innerHTML='<strong>'+p[0]+' — '+p[1]+'.</strong> '+p[2]};cb.appendChild(d)});
ce.innerHTML='<strong>85 — Група.</strong> '+PAIRS[0][2];}
const SD=${JSON.stringify(searchData)};
const q=document.getElementById("q"),sr=document.getElementById("searchResults");
function norm(s){return s.toLowerCase().replace(/\\s+/g,"");}
function doSearch(){const raw=q.value.trim();const v=raw.toLowerCase();const vc=norm(raw);
  if(!v){sr.innerHTML="";return}
  const hits=SD.filter(function(x){
    return x.n.toLowerCase().includes(v) || norm(x.k).includes(vc);
  });
  sr.innerHTML=hits.length?hits.map(function(h){return '<a class="sr-item" href="/'+h.s+'/">'+h.n+' <span>'+h.k+'</span></a>'}).join(""):'<div class="sr-empty">Нічого не знайдено. Спробуйте іншу назву, код або оберіть категорію нижче.</div>';}
q.addEventListener("input",doSearch);
document.getElementById("searchBtn").onclick=doSearch;
</script>`;

  fs.writeFileSync(path.join(OUT, "index.html"), body + ldScripts + script);
}

// ── РОЗБІР КОДУ: будує інтерактивний блок з пар цифр ──
// Працює і для повного коду (8471 30 00 00), і для неповного/парасолькового.
function buildCodeBreakdown(t) {
  // Беремо лише ПЕРШИЙ код із поля kod (до дужки, слешу чи іншого тексту),
  // щоб для товарів із кількома кодами розбір не злипався в одне довге число.
  const firstCode = (t.kod.match(/^[\d\s]+/) || [""])[0];
  const digits = (firstCode.match(/\d/g) || []).join("");
  if (digits.length < 4) return ""; // нема навіть товарної позиції — пропускаємо

  // Розбиваємо на пари: перші 4 = позиція, далі по 2
  const pos = digits.slice(0, 4);
  const rest = digits.slice(4).match(/.{1,2}/g) || [];

  const labels = ["товарна позиція", "підпозиція", "категорія", "нац. підкатегорія", "деталізація"];
  const expl = [
    `Перші 4 цифри. Визначають товар у міжнародній системі (перші 2 — група товарів, усі 4 — конкретна товарна позиція). Тут: ${esc(t.opys_pozytsii)}.`,
    "5-6 цифри. Уточнення в межах товарної позиції на рівні міжнародної номенклатури.",
    "7-8 цифри. Подальша деталізація коду.",
    "9-10 цифри. Ці цифри додає Україна для власного обліку. Більшість країн використовує перші 6 цифр, Україна додає ще 4 для точнішої класифікації.",
    "Додаткова деталізація коду."
  ];

  const parts = [pos, ...rest];
  const isPartial = !/^\d/.test(t.kod.trim()) || digits.length < 10 || /залежить|група|звіряйте/i.test(t.kod);

  const pairsHtml = parts.map((p, i) =>
    `<div class="pair${i === 0 ? " on" : ""}" data-i="${i}"><div class="digits">${p}</div><div class="plab">${labels[i] || "деталізація"}</div></div>`
  ).join("");

  const explJson = JSON.stringify(parts.map((p, i) => ({
    h: p + " — " + (labels[i] || "деталізація"),
    t: expl[i] || expl[4]
  })));

  const note = isPartial
    ? `<p class="cb-note">Це початок коду (товарна позиція). Повний 10-значний код для «${esc(t.nazva)}» залежить від конкретного товару — див. пояснення вище.</p>`
    : "";

  return `
    <h2>З чого складається код ${esc(pos)}${rest.length ? " " + rest.join(" ") : ""}</h2>
    <div class="code-explainer">
      <div class="cb-hint">Наведіть або торкніться будь-якої частини коду</div>
      <div class="codebox" id="cb">${pairsHtml}</div>
      <div class="code-expl" id="cbExpl"></div>
      ${note}
    </div>
    <script>
    (function(){
      var D=${explJson};
      var ps=document.querySelectorAll('#cb .pair'),ex=document.getElementById('cbExpl');
      function show(i){ex.innerHTML='<strong>'+D[i].h+'</strong><br>'+D[i].t;
        ps.forEach(function(p,j){p.classList.toggle('on',j===i);});}
      ps.forEach(function(p,i){p.addEventListener('mouseenter',function(){show(i);});p.addEventListener('click',function(){show(i);});});
      show(0);
    })();
    </script>`;
}

// ── ТОВАРНА СТОРІНКА ──
function buildTovar(t) {
  const canonical = `${site.domain}/${t.slug}/`;
  const title = t.title || `${t.h1} — мито, ПДВ, документи`;
  const mytoIsNum = /^\d/.test(String(t.myto).trim());
  const stavkaText = mytoIsNum
    ? `ставка ввізного мита ${t.myto}%, ПДВ ${t.pdv}%`
    : `ставки ввізного мита та ПДВ ${t.pdv}%`;
  const desc = t.description || `Який код УКТЗЕД у «${t.nazva}»: ${stavkaText}, потрібні документи та типові помилки класифікації.`;

  const pomylky = t.pomylky.map(p => `<li>${esc(p)}</li>`).join("");
  const sumizhni = t.sumizhni.map(s =>
    `<li><a href="/${s.slug}/">${esc(s.nazva)}</a> — код ${esc(s.kod)}</li>`).join("");
  const faqHtml = t.faq.map(f =>
    `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("");

  // JSON-LD: FAQPage + Article + BreadcrumbList — для сніпетів і E-E-A-T
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: t.faq.map(f => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
  const today = new Date().toISOString().slice(0, 10);
  const articleLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: t.h1,
    description: desc,
    inLanguage: "uk-UA",
    datePublished: t.data_publikacii || today,
    dateModified: t.data_onovlennia || today,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: site.name, url: site.domain + "/" },
    publisher: { "@type": "Organization", name: site.name, url: site.domain + "/" }
  };
  const cat = CAT_BY_SLUG[t.kategoria];
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: site.domain + "/" },
      ...(cat ? [{ "@type": "ListItem", position: 2, name: cat.nazva, item: `${site.domain}/${cat.slug}/` }] : []),
      { "@type": "ListItem", position: cat ? 3 : 2, name: t.nazva, item: canonical }
    ]
  };

  const body = head(title, desc, canonical) + `
  <nav class="crumbs"><a href="/">Головна</a>${cat ? ` → <a href="/${cat.slug}/">${esc(cat.nazva)}</a>` : ""} → ${esc(t.nazva)}</nav>
  <article>
    <h1>${esc(t.h1)}</h1>
    <p class="lead">Код УКТЗЕД для товару «<strong>${esc(t.nazva)}</strong>» — <strong class="kod">${esc(t.kod)}</strong>. Ставка ввізного мита — ${pct(t.myto)}, ПДВ — ${pct(t.pdv)}.</p>

    <h2>Код, мито та податки</h2>
    <table class="data">
      <tr><td>Код УКТЗЕД</td><td><strong>${esc(t.kod)}</strong></td></tr>
      <tr><td>Опис позиції</td><td>${esc(t.opys_pozytsii)}</td></tr>
      <tr><td>Ввізне мито (загальна)</td><td>${pct(t.myto)}</td></tr>
      <tr><td>Ввізне мито (ЄС / пільга)</td><td>${pct(t.myto_es)}</td></tr>
      <tr><td>ПДВ</td><td>${pct(t.pdv)}</td></tr>
      <tr><td>Акциз</td><td>${esc(t.akcyz)}</td></tr>
      <tr><td>Дозвільні документи</td><td>${esc(t.dokumenty)}</td></tr>
    </table>
    <a class="calc-cta" href="/${CALC_SLUG}/">Порахувати мито та ПДВ у калькуляторі →</a>
    <p class="disclaimer">⚠️ Ставки можуть змінюватися — завжди звіряйте з чинним Митним тарифом України перед розмитненням. Стаття має довідковий характер і не є класифікаційним рішенням митниці.</p>

    ${buildCodeBreakdown(t)}

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
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  ` + foot;

  const dir = path.join(OUT, t.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

// ── СТОРІНКА КАТЕГОРІЇ (хаб) ──
function buildCategory(cat) {
  const items = tovary.filter(t => t.kategoria === cat.slug);
  const canonical = `${site.domain}/${cat.slug}/`;
  const title = cat.title;
  const desc = `Коди УКТЗЕД, категорія «${cat.nazva}»: ${cat.tagline.toLowerCase()}. Ставки ввізного мита, ПДВ і пояснення класифікації.`;

  const cards = items.map(t => `
    <a class="tcard" href="/${t.slug}/">
      <span class="tcard-name">${esc(t.nazva)}</span>
      <span class="tcard-code">${esc(t.kod)}</span>
    </a>`).join("");

  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: site.domain + "/" },
      { "@type": "ListItem", position: 2, name: cat.nazva, item: canonical }
    ]
  };

  const body = head(title, desc, canonical, "website") + `
  <nav class="crumbs"><a href="/">Головна</a> → ${esc(cat.nazva)}</nav>
  <article>
    <h1>Коди УКТЗЕД: ${esc(cat.nazva)}</h1>
    <p class="lead">${esc(cat.intro)}</p>
    <section>
      <h2 class="sec">Товари категорії</h2>
      <div class="tgrid">${cards}</div>
    </section>
  </article>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  ` + foot;

  const dir = path.join(OUT, cat.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

// ── СТОРІНКА КАЛЬКУЛЯТОРА ──
// ── СТОРІНКА КАЛЬКУЛЯТОРА (CALC_SLUG оголошено вгорі) ──
function buildCalculator() {
  const canonical = `${site.domain}/${CALC_SLUG}/`;
  const title = "Калькулятор митних платежів: розрахунок мита та ПДВ";
  const desc = "Калькулятор митних платежів онлайн: розрахунок ввізного мита та ПДВ за курсом НБУ. Для посилок і комерційного імпорту. Швидко і зрозуміло.";

  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: site.domain + "/" },
      { "@type": "ListItem", position: 2, name: "Калькулятор митних платежів", item: canonical }
    ]
  };

  const calcUI = `
  <div class="calc">
    <div class="calc-row">
      <div class="calc-modes">
        <label class="calc-mode"><input type="radio" name="calcMode" value="posylka" checked> Посилка (фізособа)</label>
        <label class="calc-mode"><input type="radio" name="calcMode" value="komerc"> Комерційний імпорт</label>
      </div>
      <p class="calc-hint" id="calcHint">Для посилок діє неоподатковуваний поріг 150 €: платежі нараховуються лише на суму понад 150 €.</p>
    </div>
    <div class="calc-row">
      <label>Митна вартість товару
        <div class="calc-input"><input type="number" id="calcVartist" min="0" step="any" inputmode="decimal" placeholder="0"></div>
      </label>
    </div>
    <div class="calc-row">
      <label>Валюта вартості
        <select id="calcCur">
          <option value="UAH">Гривня (грн)</option>
          <option value="USD" selected>Долар США (USD)</option>
          <option value="EUR">Євро (EUR)</option>
          <option value="GBP">Фунт стерлінгів (GBP)</option>
          <option value="PLN">Польський злотий (PLN)</option>
        </select>
      </label>
      <p class="calc-hint" id="rateInfo">Курси завантажуються з Національного банку України…</p>
      <div class="calc-row" id="manualRateWrap" style="display:none;margin-top:10px">
        <label>Курс <span id="manualCurCode">валюти</span> до гривні (введіть вручну)
          <input type="number" id="manualRate" min="0" step="any" placeholder="напр. 41.5">
        </label>
        <label style="margin-top:8px">Курс євро до гривні (для порога 150 €)
          <input type="number" id="manualEur" min="0" step="any" placeholder="напр. 51.5">
        </label>
      </div>
    </div>
    <div class="calc-row calc-two" id="rateFields" style="display:none">
      <label>Ставка ввізного мита, %
        <input type="number" id="calcMyto" min="0" step="any" placeholder="напр. 10">
      </label>
      <label>Ставка ПДВ, %
        <input type="number" id="calcPdv" min="0" step="any" value="20">
      </label>
    </div>
    <div class="calc-row">
      <button id="calcBtn">Порахувати</button>
    </div>
    <div class="calc-out" id="calcOut" style="display:none">
      <div class="calc-line"><span>Повна вартість товару</span><b id="outFull">—</b></div>
      <div class="calc-line" id="lineThreshold"><span>Неоподатковуваний поріг 150 €</span><b id="outThreshold">—</b></div>
      <div class="calc-line" id="lineTaxable"><span>Оподатковувана база</span><b id="outBase">—</b></div>
      <div class="calc-line"><span>Ввізне мито <i id="outMytoPct"></i></span><b id="outMyto">—</b></div>
      <div class="calc-line"><span>База для ПДВ <small>(база + мито)</small></span><b id="outPdvBase">—</b></div>
      <div class="calc-line"><span>ПДВ <i id="outPdvPct"></i></span><b id="outPdv">—</b></div>
      <div class="calc-line calc-total"><span>Разом платежів</span><b id="outTotal">—</b></div>
      <div class="calc-line" id="lineTotalCur"><span>Платежі у валюті товару</span><b id="outTotalCur">—</b></div>
      <div class="calc-line"><span>Платежі від вартості</span><b id="outPercent">—</b></div>
      <div class="calc-line calc-grand"><span>Усього з товаром</span><b id="outGrand">—</b></div>
    </div>
    <p class="calc-note" id="calcNote" style="display:none"></p>
    <p class="calc-akciz" id="calcAkciz"></p>
  </div>`;

  const calcScript = `<script>
(function(){
  var RATES={UAH:1}, EURRATE=0, loaded=false;
  var rateInfo=document.getElementById("rateInfo");
  var hint=document.getElementById("calcHint");
  function mode(){return document.querySelector('input[name="calcMode"]:checked').value;}
  function fmt(n){return n.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})+" грн";}
  function syncMode(){
    var rf=document.getElementById("rateFields");
    var akciz=document.getElementById("calcAkciz");
    if(mode()==="posylka"){
      rf.style.display="none";
      hint.textContent="Для посилок діє неоподатковуваний поріг 150 €: на суму понад 150 € нараховується мито 10% і ПДВ 20% (за курсом НБУ). Ставки фіксовані законом.";
      akciz.innerHTML="⚠️ Більшість товарів у посилках не підакцизні. Виняток — електронні сигарети та рідини для них: на них є <strong>акцизний податок</strong>, який не враховується в цьому калькуляторі.";
    } else {
      rf.style.display="";
      hint.textContent="Комерційний імпорт: мито та ПДВ нараховуються на повну митну вартість. Вкажіть ставку мита за кодом УКТЗЕД товару.";
      akciz.innerHTML="⚠️ Якщо товар підакцизний — пальне, автомобілі, алкоголь, тютюн, електронні сигарети — додатково сплачується <strong>акцизний податок</strong>, який рахується окремо за спеціальними ставками (за об'ємом двигуна, літражем, кількістю тощо) і тут не враховується. Для більшості товарів (електроніка, техніка, одяг, інструмент) акцизу немає.";
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="calcMode"]'),function(r){r.addEventListener("change",syncMode);});
  syncMode();

  var NBU_URL="https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
  var SOURCES=[
    "https://rates.taryfnyk.com",
    "https://api.codetabs.com/v1/proxy/?quest="+encodeURIComponent(NBU_URL),
    "https://corsproxy.io/?url="+encodeURIComponent(NBU_URL),
    "https://api.allorigins.win/raw?url="+encodeURIComponent(NBU_URL)
  ];
  function applyRates(data){
    data.forEach(function(it){ RATES[it.cc]=it.rate; });
    EURRATE=RATES.EUR||0;
    loaded=true;
    var d=data.length?data[0].exchangedate:"";
    rateInfo.textContent="Курси НБУ завантажено"+(d?(" на "+d):"")+". Розрахунок у гривні за офіційним курсом.";
  }
  function tryLoad(i){
    if(i>=SOURCES.length){
      rateInfo.textContent="Автоматичні курси НБУ недоступні. Введіть курс вручну (актуальний курс — на сайті bank.gov.ua).";
      var mw=document.getElementById("manualRateWrap");
      if(mw)mw.style.display="";
      syncManualCur();
      return;
    }
    fetch(SOURCES[i])
      .then(function(r){ if(!r.ok) throw new Error("bad"); return r.json(); })
      .then(function(data){
        if(Array.isArray(data) && data.length){ applyRates(data); }
        else { throw new Error("empty"); }
      })
      .catch(function(){ tryLoad(i+1); });
  }
  function syncManualCur(){
    var sel=document.getElementById("calcCur");
    var code=sel.value;
    var mr=document.getElementById("manualRate");
    var lbl=document.getElementById("manualCurCode");
    var mrLabel=mr.parentNode;
    if(code==="UAH"){ mrLabel.style.display="none"; }
    else { mrLabel.style.display=""; if(lbl)lbl.textContent=code; }
  }
  tryLoad(0);
  document.getElementById("calcCur").addEventListener("change",syncManualCur);

  document.getElementById("calcBtn").addEventListener("click",function(){
    var raw=document.getElementById("calcVartist").value;
    var v=parseFloat(raw);
    var ccode=document.getElementById("calcCur").value;
    var out=document.getElementById("calcOut");
    var note=document.getElementById("calcNote");

    if(raw.trim()==="" || isNaN(v) || v<=0){
      out.style.display="none"; note.style.display="";
      note.textContent="Введіть коректну вартість товару — додатне число (наприклад, 250).";
      return;
    }

    // курс валюти: автоматичний або ручний фолбек
    var rate=RATES[ccode];
    if(ccode!=="UAH" && !rate){
      var manual=parseFloat(document.getElementById("manualRate").value);
      if(manual>0)rate=manual;
    }
    // курс євро для порога: автоматичний або ручний
    var eurRate=EURRATE;
    if(!eurRate){
      var manualEur=parseFloat(document.getElementById("manualEur").value);
      if(manualEur>0)eurRate=manualEur;
    }

    if(ccode!=="UAH" && !rate){
      out.style.display="none"; note.style.display="";
      note.textContent="Курс валюти недоступний. Введіть курс вручну в полі вище або оберіть гривню.";
      return;
    }

    var baseUah=v*(ccode==="UAH"?1:rate);
    var noteText="";

    var fullUah=baseUah;
    var taxableUah=baseUah;
    var lineThreshold=document.getElementById("lineThreshold");
    var lineTaxable=document.getElementById("lineTaxable");

    if(mode()==="posylka"){
      if(!eurRate){
        out.style.display="none"; note.style.display="";
        note.textContent="Для порога 150 € потрібен курс євро. Введіть його вручну в полі вище або оновіть сторінку.";
        document.getElementById("manualRateWrap").style.display="";
        syncManualCur();
        return;
      }
      var thresholdUah=150*eurRate;
      if(fullUah<=thresholdUah){
        out.style.display="none"; note.style.display="";
        note.textContent="Вартість не перевищує 150 € ("+fmt(thresholdUah)+") — митні платежі не нараховуються. До сплати лише вартість товару.";
        return;
      }
      taxableUah=fullUah-thresholdUah;
      lineThreshold.style.display="";
      lineTaxable.style.display="";
      document.getElementById("outThreshold").textContent="− "+fmt(thresholdUah);
      noteText="Поріг 150 € — "+fmt(thresholdUah)+". Мито і ПДВ нараховано лише на суму понад поріг.";
    } else {
      lineThreshold.style.display="none";
      lineTaxable.style.display="none";
    }

    var mytoPct, pdvPct;
    if(mode()==="posylka"){
      mytoPct=10; pdvPct=20;
    } else {
      mytoPct=parseFloat(document.getElementById("calcMyto").value)||0;
      pdvPct=parseFloat(document.getElementById("calcPdv").value);
      if(isNaN(pdvPct))pdvPct=20;
    }
    var myto=taxableUah*mytoPct/100;
    var pdvBase=taxableUah+myto;
    var pdv=pdvBase*pdvPct/100;
    var total=myto+pdv;
    var grand=fullUah+total;
    document.getElementById("outFull").textContent=fmt(fullUah);
    document.getElementById("outBase").textContent=fmt(taxableUah);
    document.getElementById("outMyto").textContent=fmt(myto);
    document.getElementById("outMytoPct").textContent="("+mytoPct+"%)";
    document.getElementById("outPdvBase").textContent=fmt(pdvBase);
    document.getElementById("outPdv").textContent=fmt(pdv);
    document.getElementById("outPdvPct").textContent="("+pdvPct+"%)";
    document.getElementById("outTotal").textContent=fmt(total);
    var lineTotalCur=document.getElementById("lineTotalCur");
    if(ccode==="UAH"){
      lineTotalCur.style.display="none";
    } else {
      lineTotalCur.style.display="";
      var totalInCur=total/rate;
      document.getElementById("outTotalCur").textContent="≈ "+totalInCur.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})+" "+ccode;
    }
    var percent=fullUah>0?(total/fullUah*100):0;
    document.getElementById("outPercent").textContent=percent.toLocaleString("uk-UA",{minimumFractionDigits:1,maximumFractionDigits:1})+"% від вартості товару";
    document.getElementById("outGrand").textContent=fmt(grand);
    out.style.display="";
    if(noteText){note.style.display="";note.textContent=noteText;}else{note.style.display="none";}
  });
})();
</script>`;

  const body = head(title, desc, canonical, "website") + `
  <nav class="crumbs"><a href="/">Головна</a> → Калькулятор митних платежів</nav>
  <article>
    <h1>Калькулятор розрахунку митних платежів</h1>
    <p class="lead">Розрахуйте орієнтовну суму митних платежів при імпорті товару в Україну: ввізне мито та ПДВ. Введіть митну вартість товару і ставку мита для його коду УКТЗЕД — калькулятор покаже суму мита, ПДВ і загальні платежі.</p>
    ${calcUI}
    <section>
      <h2 class="sec">Як рахуються митні платежі</h2>
      <p>Розрахунок іде у два кроки. Спершу нараховується ввізне мито — відсоток від митної вартості товару. Потім нараховується ПДВ, але вже на суму митної вартості разом із митом (мито входить до бази оподаткування ПДВ). Тобто формула така: <strong>мито = вартість × ставка мита</strong>, а <strong>ПДВ = (вартість + мито) × ставка ПДВ</strong>. Загальна сума платежів — це мито плюс ПДВ.</p>
      <p><strong>Посилки фізичним особам.</strong> Діє неоподатковуваний поріг 150 євро: якщо вартість товару не перевищує 150 €, митні платежі не сплачуються, а якщо перевищує — мито і ПДВ нараховуються лише на суму понад 150 €. На цю суму застосовується єдина ставка: 10% мита і 20% ПДВ, незалежно від виду товару.</p>
      <p><strong>Комерційний імпорт.</strong> Неоподатковуваного порога немає — платежі рахуються від повної митної вартості, а ставка ввізного мита залежить від конкретного коду УКТЗЕД товару (від 0% до 10% і більше). Якщо товар походить із країни, з якою Україна має угоду про вільну торгівлю (ЄС, Велика Британія та інші), за наявності сертифіката походження мито може бути знижене аж до 0%. Калькулятор має обидва режими — перемкніть угорі потрібний.</p>
      <p>Вартість можна вводити в гривні або у валюті (долар, євро, фунт, злотий) — курси автоматично завантажуються за офіційним курсом Національного банку України на поточну дату, а поріг 150 € перевіряється теж за курсом НБУ. Ставку ввізного мита для конкретного товару знайдете на його сторінці в довіднику — у більшості випадків її треба звіряти за повним кодом УКТЗЕД. Базова ставка ПДВ при імпорті — 20%, але для окремих товарів (наприклад, ліків) діє знижена. Для деяких категорій також можливий акциз, який цей калькулятор не враховує.</p>
    </section>
    <p class="disclaimer">⚠️ Розрахунок орієнтовний і не враховує митні збори та можливі пільги чи преференції. Точні платежі визначає митниця за чинним Митним тарифом України. Звіряйте ставки перед розмитненням.</p>
  </article>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  ${calcScript}
  ` + foot;

  const dir = path.join(OUT, CALC_SLUG);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

// ── CLOUDFLARE WORKER (проксі курсів НБУ, обходить CORS і VPN) ──
function buildWorker() {
  const code = `// Cloudflare Pages _worker.js — підхоплюється навіть при drag-and-drop deploy
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
`;
  fs.writeFileSync(path.join(OUT, "_worker.js"), code);
}

// ── СТОРІНКА «ПРО ПРОЄКТ» ──
// ── СТОРІНКА «ПРО ПРОЄКТ» (ABOUT_SLUG оголошено вгорі) ──
function buildAbout() {
  const canonical = `${site.domain}/${ABOUT_SLUG}/`;
  const title = "Про проєкт — Тарифник, довідник кодів УКТЗЕД";
  const desc = "Тарифник — довідник кодів УКТЗЕД зрозумілою мовою. Пояснюємо логіку класифікації товарів, ставки мита та ПДВ. Для імпортерів, підприємців і покупців із-за кордону.";

  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: site.domain + "/" },
      { "@type": "ListItem", position: 2, name: "Про проєкт", item: canonical }
    ]
  };

  const body = head(title, desc, canonical, "website") + `
  <nav class="crumbs"><a href="/">Головна</a> → Про проєкт</nav>
  <article>
    <h1>Про проєкт «Тарифник»</h1>
    <p class="lead">«Тарифник» — це довідник кодів УКТЗЕД зрозумілою мовою. Ми допомагаємо розібратися, до якого коду належить товар, яка на нього ставка ввізного мита та ПДВ і за якою логікою відбувається класифікація.</p>

    <section>
      <h2 class="sec">Навіщо ми це робимо</h2>
      <p>Українська класифікація товарів (УКТЗЕД) побудована на тисячах кодів зі складною ієрархією, а офіційні джерела написані сухою мовою нормативних документів. Людині, яка вперше стикається з розмитненням — імпортеру-початківцю, підприємцю чи звичайному покупцю, що замовив товар із-за кордону — у цьому легко загубитися.</p>
      <p>Ми ставимо собі за мету пояснити логіку класифікації простими словами: не просто назвати код, а показати, чому товар належить саме до нього, які бувають типові помилки й чим відрізняються схожі позиції. Замість сухого переліку цифр — зрозуміле пояснення, яке допомагає прийняти рішення усвідомлено.</p>
    </section>

    <section>
      <h2 class="sec">Що ви знайдете на сайті</h2>
      <p>Для кожного товару ми наводимо код УКТЗЕД, опис позиції, орієнтовні ставки ввізного мита та ПДВ, перелік типових помилок класифікації й відповіді на поширені запитання. Окремо пояснюємо, як визначається код і чим відрізняються суміжні товари. Для розрахунку платежів є <a href="/${CALC_SLUG}/">калькулятор митних платежів</a> з актуальними курсами Національного банку України.</p>
    </section>

    <section>
      <h2 class="sec">Звідки ми беремо інформацію</h2>
      <p>Коди й ставки ми звіряємо з чинним Митним тарифом України, офіційними поясненнями до УКТЗЕД та публічними реєстрами митних декларацій. Курси валют у калькуляторі надходять напряму з відкритих даних Національного банку України. Ми регулярно переглядаємо матеріали, щоб вони залишалися актуальними.</p>
    </section>

    <section>
      <h2 class="sec">Важливе застереження</h2>
      <p>Матеріали сайту мають довідковий та інформаційний характер. Вони допомагають зорієнтуватися, але не є офіційним класифікаційним рішенням. Остаточне визначення коду товару й нарахування митних платежів здійснює митниця на підставі поданих документів та чинного законодавства. Ставки й правила можуть змінюватися, тому перед розмитненням завжди звіряйте дані з чинним Митним тарифом України або консультуйтеся з митним брокером.</p>
    </section>

    <p class="about-sign">Дякуємо, що користуєтесь Тарифником. Ми працюємо над тим, щоб складна митна тема ставала зрозумілішою.<br>З повагою, команда «Тарифник».</p>
  </article>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  ` + foot;

  const dir = path.join(OUT, ABOUT_SLUG);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

// ── ТЕХНІЧНІ СТОРІНКИ (політика, умови) ──
function buildLegalPage(slug, h1, title, desc, sections) {
  const canonical = `${site.domain}/${slug}/`;
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: site.domain + "/" },
      { "@type": "ListItem", position: 2, name: h1, item: canonical }
    ]
  };
  const secHtml = sections.map(s =>
    `<section><h2 class="sec">${esc(s.h)}</h2>${s.p.map(p => `<p>${p}</p>`).join("")}</section>`
  ).join("\n");

  const body = head(title, desc, canonical, "website") + `
  <nav class="crumbs"><a href="/">Головна</a> → ${esc(h1)}</nav>
  <article>
    <h1>${esc(h1)}</h1>
    ${secHtml}
  </article>
  <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
  ` + foot;

  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), body);
}

function buildPrivacy() {
  buildLegalPage(
    PRIVACY_SLUG,
    "Політика конфіденційності",
    "Політика конфіденційності — Тарифник",
    "Політика конфіденційності сайту Тарифник: які дані ми обробляємо та як захищаємо приватність користувачів.",
    [
      { h: "Загальні положення", p: [
        "Ця Політика конфіденційності описує, як сайт «Тарифник» (далі — Сайт) поводиться з інформацією користувачів. Користуючись Сайтом, ви погоджуєтесь із цією Політикою.",
        "Ми поважаємо вашу приватність і прагнемо збирати якомога менше даних — лише те, що потрібно для роботи Сайту."
      ]},
      { h: "Які дані ми збираємо", p: [
        "Сайт має суто інформаційний, довідковий характер і не вимагає реєстрації. Ми не збираємо й не зберігаємо персональних даних користувачів: імен, адрес, телефонів, платіжної інформації.",
        "Сайт не використовує рекламних чи аналітичних систем стеження й не встановлює маркетингових файлів cookie. Розрахунки в калькуляторі виконуються безпосередньо у вашому браузері й не передаються нам."
      ]},
      { h: "Зовнішні сервіси", p: [
        "Для відображення актуальних курсів валют калькулятор звертається до відкритих даних Національного банку України. Цей запит не містить ваших персональних даних.",
        "Сайт використовує інфраструктуру Cloudflare для розміщення та доставки контенту. Cloudflare може обробляти технічні дані (наприклад, IP-адресу) для забезпечення безпеки й роботи сайту відповідно до власної політики конфіденційності."
      ]},
      { h: "Файли cookie", p: [
        "Сайт не встановлює власних рекламних чи аналітичних файлів cookie. Можуть використовуватися лише технічні файли, необхідні для базової роботи й безпеки сайту з боку інфраструктури Cloudflare."
      ]},
      { h: "Зміни до політики", p: [
        "Ми можемо час від часу оновлювати цю Політику. Актуальна версія завжди доступна на цій сторінці. Якщо у вас є запитання щодо обробки даних, ви можете звернутися через канали зв'язку, зазначені на сайті."
      ]}
    ]
  );
}

function buildTerms() {
  buildLegalPage(
    TERMS_SLUG,
    "Умови використання",
    "Умови використання — Тарифник",
    "Умови використання сайту Тарифник: правила користування довідником кодів УКТЗЕД та межі відповідальності.",
    [
      { h: "Загальні положення", p: [
        "Ці Умови використання регулюють користування сайтом «Тарифник» (далі — Сайт). Відкриваючи й використовуючи Сайт, ви погоджуєтесь із цими Умовами. Якщо ви не згодні з ними, будь ласка, не користуйтеся Сайтом."
      ]},
      { h: "Характер інформації", p: [
        "Сайт надає довідкову та інформаційну допомогу щодо класифікації товарів за УКТЗЕД, орієнтовних ставок мита й ПДВ. Уся інформація має ознайомлювальний характер.",
        "Матеріали Сайту не є офіційним класифікаційним рішенням, юридичною чи податковою консультацією. Остаточне визначення коду товару й нарахування митних платежів здійснює митниця на підставі чинного законодавства та поданих документів."
      ]},
      { h: "Відповідальність", p: [
        "Ми докладаємо зусиль, щоб інформація була точною й актуальною, проте не гарантуємо її повноти й безпомилковості, оскільки митне законодавство та ставки можуть змінюватися.",
        "Рішення, прийняті на основі матеріалів Сайту, користувач ухвалює на власний розсуд і під власну відповідальність. Перед розмитненням завжди звіряйте дані з чинним Митним тарифом України або консультуйтеся з митним брокером. Адміністрація Сайту не несе відповідальності за можливі збитки, пов'язані з використанням інформації."
      ]},
      { h: "Інтелектуальна власність", p: [
        "Тексти, структура й оформлення Сайту є результатом нашої роботи. Ви можете користуватися інформацією для власних потреб, але копіювання матеріалів у значному обсязі для повторної публікації без посилання на джерело не допускається."
      ]},
      { h: "Зміни умов", p: [
        "Ми можемо оновлювати ці Умови. Актуальна версія завжди розміщена на цій сторінці, тож радимо періодично її переглядати."
      ]}
    ]
  );
}

// ── SITEMAP ──
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["", CALC_SLUG + "/", ABOUT_SLUG + "/", PRIVACY_SLUG + "/", TERMS_SLUG + "/", ...blogUrls(), ...CATEGORIES.map(c => c.slug + "/"), ...tovary.map(t => t.slug + "/")];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.domain}/${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>`;
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), xml);
}

// ── ROBOTS.TXT ──
function buildRobots() {
  const txt = `User-agent: *
Allow: /

Sitemap: ${site.domain}/sitemap.xml
`;
  fs.writeFileSync(path.join(OUT, "robots.txt"), txt);
}

// ── ЗАПУСК ──
fs.mkdirSync(OUT, { recursive: true });

// копіюємо фавікони з assets у dist (щоб не залежати від ручного втручання)
function copyFavicons() {
  const src = path.join(__dirname, "assets", "favicons");
  if (!fs.existsSync(src)) return;
  for (const f of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, f), path.join(OUT, f));
  }
}
copyFavicons();

buildIndex();
buildCalculator();
buildAbout();
buildPrivacy();
buildTerms();
buildBlog({ OUT, fs, path, head, foot, esc, site });
CATEGORIES.forEach(buildCategory);
tovary.forEach(buildTovar);
buildSitemap();
buildRobots();
buildWorker();
const totalPages = 5 + blogUrls().length + CATEGORIES.length + tovary.length;
console.log(`✓ Готово. Згенеровано сторінок: ${totalPages} (головна + калькулятор + про проєкт + 2 техсторінки + блог(${blogUrls().length}) + ${CATEGORIES.length} категорій + ${tovary.length} товарних)`);
console.log(`✓ Створено sitemap.xml + robots.txt`);
console.log(`✓ Усе лежить у папці dist/`);

