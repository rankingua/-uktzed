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
.site-head{background:#1a4fa0;border-bottom:1px solid #163f80;padding:14px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.logo{display:inline-flex;align-items:center;gap:9px;font-weight:700;font-size:18px;color:#fff;text-decoration:none}
.logo-bars{display:inline-flex;align-items:flex-end;gap:2px;height:22px}
.logo-bars i{display:block;width:2px;height:22px;background:#fff;border-radius:1px}
.logo-sub{font-size:13px;color:#c5d6f0;align-self:center}
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
.mistakes li,.related li{margin-bottom:7px}
.related a{color:#1a4fa0}
.faq-item h3{color:#1a2230}
.faq-item p{margin:0 0 4px;color:#3a4a5d}
.site-foot{border-top:1px solid #e3e9f0;background:#fff;padding:20px;margin-top:40px}
.site-foot p{max-width:860px;margin:0 auto;font-size:12px;color:#8090a3}
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

// Спільний <head> для всіх сторінок: мета-теги, og, стилі
// ogType: "website" для головної, "article" для товарних
function head(title, description, canonical, ogType = "article") {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${canonical}">
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
    <p>Введіть назву товару — отримайте код, ставку мита, ПДВ і перелік документів для розмитнення. Зрозуміло, без бюрократичної мови.</p>
    <div class="searchrow">
      <input type="text" id="q" placeholder="Напр.: навушники, кросівки, сонячні панелі…" autocomplete="off">
      <button id="searchBtn">Знайти</button>
    </div>
    <div class="search-results" id="searchResults"></div>
    <div class="chips" id="chips">${chips}</div>
  </section>

  ${codeDemo}

  <section>
    <h2 class="sec">Категорії товарів</h2>
    <div class="cgrid">${catCards}</div>
  </section>

  <section>
    <h2 class="sec">Усі товари</h2>
    <div class="tgrid">${cards}</div>
  </section>

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
PAIRS.forEach((p,i)=>{const d=document.createElement("div");d.className="pair"+(i===0?" on":"");d.innerHTML='<div class="digits">'+p[0]+'</div><div class="plab">'+p[1]+'</div>';d.onclick=function(){[].forEach.call(cb.children,c=>c.classList.remove("on"));d.classList.add("on");ce.innerHTML='<strong>'+p[0]+' — '+p[1]+'.</strong> '+p[2]};cb.appendChild(d)});
ce.innerHTML='<strong>85 — Група.</strong> '+PAIRS[0][2];
const SD=${JSON.stringify(searchData)};
const q=document.getElementById("q"),sr=document.getElementById("searchResults"),chips=document.getElementById("chips");
function doSearch(){const v=q.value.trim().toLowerCase();
  if(!v){sr.innerHTML="";if(chips)chips.style.display="";return}
  if(chips)chips.style.display="none";
  const hits=SD.filter(x=>x.n.toLowerCase().includes(v));
  sr.innerHTML=hits.length?hits.map(h=>'<a class="sr-item" href="/'+h.s+'/">'+h.n+' <span>'+h.k+'</span></a>').join(""):'<div class="sr-empty">Нічого не знайдено. Спробуйте іншу назву або перегляньте каталог нижче.</div>';}
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
  const desc = `Який код УКТЗЕД у «${t.nazva}»: ${stavkaText}, потрібні документи та типові помилки класифікації.`;

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

// ── SITEMAP ──
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["", ...CATEGORIES.map(c => c.slug + "/"), ...tovary.map(t => t.slug + "/")];
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
buildIndex();
CATEGORIES.forEach(buildCategory);
tovary.forEach(buildTovar);
buildSitemap();
buildRobots();
const totalPages = 1 + CATEGORIES.length + tovary.length;
console.log(`✓ Готово. Згенеровано сторінок: ${totalPages} (головна + ${CATEGORIES.length} категорій + ${tovary.length} товарних)`);
console.log(`✓ Створено sitemap.xml + robots.txt`);
console.log(`✓ Усе лежить у папці dist/`);

