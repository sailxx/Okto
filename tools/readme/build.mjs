// Картинки README в стиле Okto Calc: чёрный фон, мягкие белые свечения, градиентные акценты,
// шрифты Golos Text и JetBrains Mono (урезаются под каждый язык). Красный — только там, где он есть в самом Okto: время.
// Шрифты (OFL-1.1) положить в tools/readme/.font/: golos.ttf (Golos Text) и jbmono.ttf (JetBrains Mono).
// Строки — tools/readme/strings.json, cards2.json, md.json; *слово* — акцент.
// Запуск из корня: npm install --prefix tools/readme && node tools/readme/build.mjs
import fs from "node:fs";
import { createKit, ICONS } from "./kit.mjs";
import { renderPngs } from "./png.mjs";

const dir = "tools/readme/";
// Версия Android-приложения для подписи плашки — из android/app/build.gradle.kts, чтобы не устаревала
const VERSION = fs.readFileSync("android/app/build.gradle.kts", "utf8").match(/versionName = "([^"]+)"/)[1];
const out = "assets/readme/";
fs.mkdirSync(out, { recursive: true });

const K = createKit({
  golos: dir + ".font/golos.ttf",
  mono: dir + ".font/jbmono.ttf",
  accent: { hi: "#FFFFFF", grad: ["#FFFFFF", "#8D8D8D"], on: "#000000", glow: "#FFFFFF", glowOpacity: 0.16, glow2: "#9AA4B8", btn: ["#FFFFFF", "#D9D9D9"] },
});
const { P, T, card, chip, sectionHead, badge, iconBox, lines, wrap, one, fitSize, fitText, delay, svg, plain } = K;
const RED = "#EF5A5F", W = 880;

// Логотип Okto — assets/logo/okto-logo.svg (рисует tools/icons/build.mjs), id с префиксом, чтобы не пересечься с плашкой
const LOGO = fs.readFileSync("assets/logo/okto-logo.svg", "utf8").trim().replace(/^<svg[^>]*>|<\/svg>$/g, "").replace(/(id="|url\(#)o/g, "$1lo");
const logo = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 104})">${LOGO}</g>`;

// Пункт списка: «›» и текст с акцентами
function bullets(x, y, items, maxW, size = 14, lh = 20, gap = 8) {
  let s = "";
  for (const it of items) {
    const ls = wrap(it, maxW - 16, size, 500);
    s += `<text class="m" x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="#fff">›</text>` + lines(x + 16, y, ls, { size, weight: 500, lh, fill: P.muted });
    y += ls.length * lh + gap;
  }
  return { s, y };
}
const bulletsH = (items, maxW, size = 14, lh = 20, gap = 8) => items.reduce((a, it) => a + wrap(it, maxW - 16, size, 500).length * lh + gap, 0);

// ---------- HERO: табло фокуса справа ----------
function heroSvg(s) {
  let b = `<g class="r">${logo(40, 36, 36)}<text x="88" y="62" font-size="24" font-weight="800" letter-spacing="-.5">${T("Okto")}</text></g>`;
  b += `<g class="r" ${delay(1)}>${chip(164, 39, s.tag).s}</g>`;
  const t1 = wrap(s.l1, 500, 38, 800), t2 = wrap(s.l2, 500, 38, 800);
  const tl = [...t1, ...t2];
  b += `<g class="r" ${delay(2)}>${lines(40, 140, tl, { size: 38, weight: 800, lh: 46, spacing: "-1" })}</g>`;
  let y = 140 + (tl.length - 1) * 46 + 40;
  const sub = wrap(s.sub, 500, 16, 500);
  b += `<g class="r" ${delay(3)}>${lines(40, y, sub, { size: 16, weight: 500, lh: 24, fill: P.muted })}</g>`;
  y += (sub.length - 1) * 24 + 34;
  // табло фокуса
  const wx = 576, wy = 104, ww = 264, wh = 180;
  b += `<g class="r" ${delay(3)}><ellipse cx="${wx + ww / 2}" cy="${wy + wh / 2}" rx="170" ry="150" fill="url(#g1)"/>${card(wx, wy, ww, wh, 20)}
<rect x="${wx + 14}" y="${wy + 14}" width="${ww - 28}" height="${wh - 28}" rx="12" fill="#0A0A0A" stroke="#1F1F1F"/>
<circle class="blink" cx="${wx + 32}" cy="${wy + 36}" r="3.5" fill="${RED}"/>${fitText(wx + 42, wy + 40, s.disp, ww - 70, { size: 10, weight: 600, mono: true, spacing: 1.6, fill: P.dim })}
<text class="m" x="${wx + 30}" y="${wy + 108}" font-size="60" font-weight="700" letter-spacing="-2" fill="#fff" fill-opacity=".05">${T("88:88")}</text>
<text class="m" x="${wx + 30}" y="${wy + 108}" font-size="60" font-weight="700" letter-spacing="-2" fill="${RED}">${T("25")}<tspan class="blink">${T(":")}</tspan>${T("00")}</text>
${Array.from({ length: 12 }, (_, i) => `<rect x="${wx + 30 + i * 17.4}" y="${wy + 122}" width="14" height="5" rx="1.5" fill="${i < 4 ? RED : "#fff"}" fill-opacity="${i < 4 ? 1 : 0.12}"/>`).join("")}
${fitText(wx + 30, wy + 148, s.next, ww - 100, { size: 11, weight: 500, fill: P.dim })}<text class="m" x="${wx + ww - 30}" y="${wy + 148}" text-anchor="end" font-size="11" fill="${P.dim}">${T("25/5")}</text></g>`;
  y = Math.max(y, wy + wh + 30);
  // четыре плитки
  const TW = (800 - 3 * 12) / 4;
  const tiles = s.tiles.map(([t, d]) => ({ t: plain(t), d: wrap(d, TW - 36, 13, 500) }));
  const th = 52 + Math.max(...tiles.map((x) => x.d.length)) * 18 + 6;
  tiles.forEach((x, i) => {
    const X = 40 + i * (TW + 12);
    b += `<g class="r" ${delay(4 + i)}>${card(X, y, TW, th)}<circle cx="${X + 22}" cy="${y + 27}" r="4" fill="#fff"/>
${fitText(X + 34, y + 32, x.t, TW - 50, { size: 15, weight: 700 })}
${lines(X + 18, y + 56, x.d, { size: 13, weight: 500, lh: 18, fill: P.muted })}</g>`;
  });
  return svg(W, y + th + 36, `Okto — ${plain(s.l1)} ${plain(s.l2)} ${s.sub}`, b);
}

// ---------- Иллюстрации разделов: тёмные табло, как экраны Okto ----------
const INK = "#F2F2F2", DIM = "#8A8A8A";
function illo(kind, s, x, y, w) {
  const h = 112;
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#0A0A0A" stroke="#1F1F1F"/>`;
  if (kind === "home") {
    g += `<text class="m" x="${x + 14}" y="${y + 24}" font-size="9" font-weight="600" letter-spacing="1.6" fill="${DIM}">${T(s.home[3])}</text>` +
      `<text class="m" x="${x + 14}" y="${y + 84}" font-size="46" font-weight="700" letter-spacing="-1.5" fill="${INK}">${T("03")}<tspan fill="${DIM}">${T("/")}</tspan>${T("05")}</text>`;
    const hs = [18, 30, 22, 40, 26, 48, 34, 20, 44, 52, 38, 28, 46, 60];
    const bw = (w - 180 - 14) / hs.length;
    hs.forEach((v, i) => { g += `<rect x="${(x + 180 + i * bw).toFixed(1)}" y="${y + 94 - v}" width="${(bw - 4).toFixed(1)}" height="${v}" rx="1.5" fill="${INK}" fill-opacity="${i === hs.length - 1 ? 1 : 0.22 + i * 0.03}"/>`; });
  } else if (kind === "tasks") {
    s.tasks[3].forEach((n, i) => {
      const ry = y + 28 + i * 30, done = i === 0;
      g += `<rect x="${x + 14}" y="${ry - 11}" width="14" height="14" rx="4" fill="${done ? INK : "none"}" stroke="${INK}" stroke-opacity="${done ? 1 : 0.5}" stroke-width="1.4"/>` +
        (done ? `<path d="M${x + 17.5} ${ry - 4}l2.6 2.6 4.6-5" fill="none" stroke="#0A0A0A" stroke-width="1.8" stroke-linecap="round"/>` : "") +
        fitText(x + 38, ry, n, w - 130, { size: 12, weight: 500, fill: done ? DIM : INK }) +
        (i === 1 ? `<circle cx="${x + w - 64}" cy="${ry - 4}" r="3.5" fill="${RED}"/><text class="m" x="${x + w - 14}" y="${ry}" text-anchor="end" font-size="10" fill="${DIM}">${T("18:00")}</text>` : "") +
        (i === 2 ? `<text class="m" x="${x + w - 14}" y="${ry}" text-anchor="end" font-size="11" fill="${DIM}">${T("↻ 7")}</text>` : "") +
        (i < 2 ? `<line x1="${x + 14}" y1="${ry + 10}" x2="${x + w - 14}" y2="${ry + 10}" stroke="#fff" stroke-opacity=".08"/>` : "");
    });
  } else if (kind === "calendar") {
    const cw = (w - 28) / 5;
    s.calendar[3].forEach((d, i) => {
      const cx = x + 14 + i * cw;
      g += `<text class="m" x="${cx + cw / 2}" y="${y + 22}" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="1.2" fill="${i === 2 ? INK : DIM}">${T(d)}</text>` +
        (i ? `<line x1="${cx}" y1="${y + 30}" x2="${cx}" y2="${y + h - 10}" stroke="#fff" stroke-opacity=".08"/>` : "");
    });
    const blk = (col, top, len, op) => `<rect x="${x + 16 + col * cw}" y="${y + top}" width="${cw - 4}" height="${len}" rx="4" fill="${INK}" fill-opacity="${op}"/>`;
    g += blk(0, 36, 26, 0.85) + blk(1, 58, 36, 0.6) + blk(2, 34, 20, 1) + blk(3, 46, 44, 0.75) + blk(4, 38, 22, 0.5);
    g += `<line x1="${x + 14}" y1="${y + 72}" x2="${x + w - 14}" y2="${y + 72}" stroke="${RED}" stroke-width="1.6"/><circle cx="${x + 14}" cy="${y + 72}" r="3.5" fill="${RED}"/>`;
  } else if (kind === "focus") {
    g += `<text class="m" x="${x + 14}" y="${y + 74}" font-size="50" font-weight="700" letter-spacing="-2" fill="${RED}">${T("25")}<tspan class="blink">${T(":")}</tspan>${T("00")}</text>`;
    ["25/5", "15/3", "50/10"].forEach((c, i) => {
      const cy = y + 16 + i * 28;
      g += `<rect x="${x + w - 84}" y="${cy}" width="70" height="22" rx="6" fill="#fff" fill-opacity="${i ? 0.08 : 0.92}"/><text class="m" x="${x + w - 49}" y="${cy + 15}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${i ? INK : "#0A0A0A"}">${T(c)}</text>`;
    });
    g += Array.from({ length: 12 }, (_, i) => `<rect x="${x + 14 + i * 16}" y="${y + 90}" width="12" height="4" rx="1" fill="${i < 4 ? RED : "#fff"}" fill-opacity="${i < 4 ? 1 : 0.12}"/>`).join("");
  }
  return g;
}

// ---------- РАЗДЕЛЫ ----------
function sectionsSvg(s) {
  let b = `<g class="r">${chip(40, 34, s.secLabel, { check: true }).s}</g>`;
  const CW = (800 - 16) / 2, IW = CW - 40;
  const cells = ["home", "tasks", "calendar", "focus"].map((k) => {
    const [name, title, bl] = s[k];
    const t = wrap(title, IW, 20, 800);
    return { k, name, t, bl, h: 46 + t.length * 26 + 14 + 112 + 26 + bulletsH(bl, IW) + 8 };
  });
  let y = 84;
  for (let row = 0; row < 2; row++) {
    const rh = Math.max(cells[row * 2].h, cells[row * 2 + 1].h);
    for (let col = 0; col < 2; col++) {
      const c = cells[row * 2 + col], X = 40 + col * (CW + 16);
      let cy = y + 32;
      let g = card(X, y, CW, rh, 20) + badge(X + 34, cy - 4, row * 2 + col + 1, 13) +
        fitText(X + 56, cy + 1, c.name, CW - 80, { size: 11, weight: 600, mono: true, spacing: 1.6, fill: P.dim });
      cy += 34;
      g += lines(X + 20, cy, c.t, { size: 20, weight: 800, lh: 26, spacing: "-.4" });
      cy += (c.t.length - 1) * 26 + 16;
      g += illo(c.k, s, X + 20, cy, IW);
      cy += 112 + 30;
      g += bullets(X + 20, cy, c.bl, IW).s;
      b += `<g class="r" ${delay(1 + (row * 2 + col))}>${g}</g>`;
    }
    y += rh + 16;
  }
  return svg(W, y - 16 + 36, s.secLabel, b);
}

// ---------- Три колонки: синхронизация, Android, безопасность ----------
const MORE_ICONS = {
  sync: ICONS.sync, privacy: ICONS.lock,
  look: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  widget: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="3.5" y="13" width="17" height="7.5" rx="2"/><path d="M7 16.8l1.3 1.2 2.4-2.4"/>',
  oneapp: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3"/><circle cx="12" cy="10" r="2.6"/>',
  fresh: '<path d="M12 3.5l2.1 5.4 5.4 2.1-5.4 2.1-2.1 5.4-2.1-5.4-5.4-2.1 5.4-2.1z"/><path d="M19 3.5v3M17.5 5h3"/>',
  sign: ICONS.shield, data: ICONS.lock,
  perms: '<path d="M4 6.5h9M4 12h6M4 17.5h9"/><circle cx="17.5" cy="12" r="3.2"/><path d="M15.3 14.3l4.4-4.6"/>',
};
function cardsSvg(s, keys, head) {
  let b = "";
  const top = head ? 84 : 36;
  if (head) b += `<g class="r">${chip(40, 34, head, { check: true }).s}</g>`;
  const CW = (800 - 24) / 3, IW = CW - 40;
  const cells = keys.map((k) => {
    const [name, title, bl] = s[k];
    const t = wrap(title, IW, 17, 800);
    return { k, name, t, bl, h: 20 + 40 + 30 + 22 + t.length * 23 + 12 + bulletsH(bl, IW, 13, 19, 7) + 10 };
  });
  const rh = Math.max(...cells.map((c) => c.h));
  cells.forEach((c, i) => {
    const X = 40 + i * (CW + 12);
    let cy = top + 20;
    let g = card(X, top, CW, rh, 20) + iconBox(X + 20, cy, MORE_ICONS[c.k]).replace('fill="none" stroke=', 'fill="none" color="#fff" stroke=');
    cy += 40 + 30;
    g += fitText(X + 20, cy, c.name, IW, { size: 11, weight: 600, mono: true, spacing: 1.6, fill: P.dim });
    cy += 30;
    g += lines(X + 20, cy, c.t, { size: 17, weight: 800, lh: 23, spacing: "-.3" });
    cy += (c.t.length - 1) * 23 + 30;
    g += bullets(X + 20, cy, c.bl, IW, 13, 19, 7).s;
    b += `<g class="r" ${delay(1 + i)}>${g}</g>`;
  });
  return svg(W, top + rh + 36, (head ? head + " — " : "") + keys.map((k) => s[k][0]).join(" · "), b);
}
const moreSvg = (s) => cardsSvg(s, ["sync", "privacy", "look"]);
const androidSvg = (s) => cardsSvg(s, ["widget", "oneapp", "fresh"], s.appLabel.replace("{v}", VERSION));
const safeSvg = (s) => cardsSvg(s, ["sign", "data", "perms"], s.safeLabel);

// ---------- Кнопки: веб-версия — светлая основная, Android — тёмная ----------
const WIN_ICON = '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1"/><rect x="13" y="13" width="7.5" height="7.5" rx="1"/>';
const btnSvg = (label, kind) => K.button(label + (kind === "web" ? " ↗" : " ↓"), kind === "web" ? ICONS.web : kind === "windows" ? WIN_ICON : ICONS.android, kind === "web");

// ── Качество в цифрах: настоящие данные из npm test и npm run build (версия 2.0) ──
// Тесты по файлам tests/*.test.ts: recurrence 9, merge 7, migrate 5, stats 5, layout 3, settings 2
const TESTS = [9, 7, 5, 5, 3, 2];
// gzip из vite build: index.js 63,5 КБ, index.css 10,65 КБ; чанки Firebase грузятся только при синхронизации — 165,3 КБ
const SIZES = [63.5, 10.65, 165.3];
const num = (v, lang) => (lang === "en" ? String(v) : String(v).replace(".", ","));
const HATCH = '<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff" fill-opacity=".05"/><line x1="0" y1="0" x2="0" y2="6" stroke="#fff" stroke-opacity=".3" stroke-width="2"/></pattern>';

function qualitySvg(c, lang) {
  const q = c.q;
  const head = sectionHead(q.label, q.title);
  let b = head.s;
  let y = head.y;
  const PW = (800 - 16) / 2, PH = 300;
  const label = (x, yy, s, w) => fitText(x, yy, s.toUpperCase(), w, { size: 11, weight: 600, mono: true, spacing: 1.4, fill: P.dim });
  // тесты по модулям
  let L = card(40, y, PW, PH, 20) + label(60, y + 32, q.tests, PW - 40) +
    `<text class="m" x="60" y="${y + 80}" font-size="40" font-weight="700" letter-spacing="-1.5" fill="url(#tg)">${T("31")}<tspan fill="${P.dim}">${T("/")}</tspan>${T("31")}</text>` +
    fitText(196, y + 74, `${q.pass} · 100%`, PW - 176, { size: 14, weight: 600, fill: P.muted });
  const bw = PW - 40 - 34;
  TESTS.forEach((v, i) => {
    const ry = y + 112 + i * 30, w = bw * v / 9;
    L += fitText(60, ry, q.mods[i], PW - 40, { size: 12, weight: 500, fill: P.muted }) +
      `<rect x="60" y="${ry + 6}" width="${w.toFixed(1)}" height="8" rx="3" fill="#fff" fill-opacity="${i === 0 ? 1 : 0.5}"/>` +
      `<text class="m" x="${(66 + w).toFixed(1)}" y="${ry + 14}" font-size="11" font-weight="700">${T(String(v))}</text>`;
  });
  b += `<g class="r" ${delay(2)}>${L}</g>`;
  // вес приложения
  const X2 = 40 + PW + 16;
  const first = wrap(q.first, PW - 200, 12, 500);
  let R = card(X2, y, PW, PH, 20) + label(X2 + 20, y + 32, q.weight, PW - 40) +
    `<text class="m" x="${X2 + 20}" y="${y + 80}" font-size="40" font-weight="700" letter-spacing="-1.5" fill="url(#tg)">${T("74")}<tspan font-size="17" fill="${P.muted}">${T(" " + q.kb)}</tspan></text>` +
    lines(X2 + 170, y + 62, first, { size: 12, weight: 500, lh: 16, fill: P.muted });
  const bw2 = PW - 40 - 90;
  SIZES.forEach((v, i) => {
    const ry = y + 128 + i * 54, w = Math.max(6, bw2 * v / 165.3), lazy = i === 2;
    R += fitText(X2 + 20, ry, q.parts[i], PW - 40, { size: 12, weight: 500, fill: P.muted }) +
      `<rect x="${X2 + 20}" y="${ry + 8}" width="${w.toFixed(1)}" height="16" rx="4" ${lazy ? 'fill="url(#hatch)" stroke="#fff" stroke-opacity=".3"' : `fill="#fff" fill-opacity="${i === 0 ? 1 : 0.5}"`}/>` +
      `<text class="m" x="${(X2 + 28 + w).toFixed(1)}" y="${ry + 21}" font-size="11" font-weight="700" fill="${lazy ? P.dim : "#fff"}">${T(`${num(v, lang)} ${q.kb}`)}</text>`;
  });
  b += `<g class="r" ${delay(3)}>${R}</g>`;
  y += PH + 16;
  // плитки
  const TW = (800 - 48) / 5;
  q.tiles.forEach(([n, t], i) => {
    const X = 40 + i * (TW + 12), d = wrap(t, TW - 32, 12, 500);
    b += `<g class="r" ${delay(4 + i * 0.5)}>${card(X, y, TW, 112, 16)}
<text class="m" x="${X + 16}" y="${y + 50}" font-size="34" font-weight="700" letter-spacing="-1" fill="url(#tg)">${T(n)}</text>
${lines(X + 16, y + 74, d, { size: 12, weight: 500, lh: 16, fill: P.muted })}</g>`;
  });
  y += 112 + 30;
  b += fitText(40, y, q.src, 800, { size: 11, weight: 500, mono: true, fill: P.dim });
  return svg(W, y + 30, q.label + " — " + plain(q.title), b, HATCH);
}

// ── Дизайн-код: значения из DESIGN.md ──
const PALETTE = ["#FFFFFF", "#141414", "#F1F1EF", "#E4E4E1", "#D33A3F"];
const THEME_SW = [["#ffffff", "#141414"], ["#ffffff", "#141414"], ["#141414", "#ededed"], ["#e9e2d1", "#2a251b"], ["#e1eae3", "#14241a"], ["#0f141d", "#e2e7f0"], ["#000000", "#f4f4f4"]];
const THEME_NAMES = { ru: ["Системная", "Светлая", "Тёмная", "Бумага", "Мята", "Полночь", "OLED"], en: ["System", "Light", "Dark", "Paper", "Mint", "Midnight", "OLED"] };
const HALF = '<linearGradient id="half" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="#ffffff"/><stop offset=".5" stop-color="#141414"/></linearGradient>';

function designSvg(c, lang) {
  const d = c.d;
  const head = sectionHead(d.label, d.title);
  let b = head.s;
  let y = head.y + 6;
  const sub = wrap(d.sub, 800, 15, 500);
  b += `<g class="r" ${delay(1.5)}>${lines(40, y, sub, { size: 15, weight: 500, lh: 22, fill: P.muted })}</g>`;
  y += (sub.length - 1) * 22 + 26;
  const label = (x, yy, s, w) => fitText(x, yy, s, w, { size: 11, weight: 600, mono: true, spacing: 1.4, fill: P.dim });
  const LW = 476, RX = 40 + LW + 16, RW = 840 - RX;
  // палитра
  let pal = card(40, y, LW, 156, 20) + label(60, y + 30, d.palette, LW - 40);
  const sw = (LW - 40 - 4 * 10) / 5;
  PALETTE.forEach((hex, k) => {
    const x = 60 + k * (sw + 10);
    pal += `<rect x="${x}" y="${y + 44}" width="${sw}" height="56" rx="10" fill="${hex}" stroke="#fff" stroke-opacity=".12"/>` +
      fitText(x, y + 120, d.colors[k], sw, { size: 12, weight: 700, fill: k === 4 ? RED : "#fff" }) +
      `<text class="m" x="${x}" y="${y + 137}" font-size="10" fill="${P.dim}">${T(hex)}</text>`;
  });
  b += `<g class="r" ${delay(2)}>${pal}</g>`;
  // шрифты
  b += `<g class="r" ${delay(2.5)}>${card(RX, y, RW, 156, 20)}${label(RX + 20, y + 30, d.type, RW - 40)}
<text class="m" x="${RX + 20}" y="${y + 80}" font-size="34" font-weight="700" letter-spacing="-1.2">${T("25:00")}</text>
<text x="${RX + 140}" y="${y + 64}" font-size="12" font-weight="700">${T("JetBrains Mono")}</text>${lines(RX + 140, y + 80, wrap(d.mono, RW - 160, 11, 500), { size: 11, weight: 500, lh: 14, fill: P.dim })}
<text x="${RX + 20}" y="${y + 134}" font-size="34" font-weight="700" letter-spacing="-1">${T("Аа Bb")}</text>
<text x="${RX + 140}" y="${y + 118}" font-size="12" font-weight="700">${T("Golos Text")}</text>${lines(RX + 140, y + 134, wrap(d.sans, RW - 160, 11, 500), { size: 11, weight: 500, lh: 14, fill: P.dim })}</g>`;
  y += 172;
  // материалы: корпус, клавиша, утопленное табло
  const mw = (LW - 40 - 2 * 14) / 3, my = y + 44, mx = (k) => 60 + k * (mw + 14);
  let mt = card(40, y, LW, 0, 20) + label(60, y + 30, d.mat, LW - 40);
  mt += `<rect x="${mx(0)}" y="${my}" width="${mw}" height="74" rx="10" fill="#1d1d1d" stroke="#2e2e2e"/><circle cx="${mx(0) + 16}" cy="${my + 16}" r="4" fill="#fff"/><text x="${mx(0) + 26}" y="${my + 20}" font-size="11" font-weight="800">${T("okto")}</text>`;
  mt += `<rect x="${mx(1)}" y="${my}" width="${mw}" height="74" rx="10" fill="#141414" stroke="#262626"/><rect x="${mx(1) + 22}" y="${my + 14}" width="${mw - 44}" height="46" rx="10" fill="#070707"/>` +
    `<rect x="${mx(1) + 22}" y="${my + 11}" width="${mw - 44}" height="46" rx="10" fill="#262626"/><rect x="${mx(1) + 30}" y="${my + 11.5}" width="${mw - 60}" height="1" fill="url(#hl)"/>` +
    `<text class="m" x="${mx(1) + mw / 2}" y="${my + 41}" text-anchor="middle" font-size="20" font-weight="700">${T("+")}</text>`;
  mt += `<rect x="${mx(2)}" y="${my}" width="${mw}" height="74" rx="10" fill="#0A0A0A" stroke="#1F1F1F"/>` +
    `<text class="m" x="${mx(2) + 14}" y="${my + 54}" font-size="34" font-weight="700" letter-spacing="-1" fill="#fff" fill-opacity=".06">${T("88")}</text>` +
    `<text class="m" x="${mx(2) + 14}" y="${my + 54}" font-size="34" font-weight="700" letter-spacing="-1">${T("25")}</text>`;
  d.mats.forEach((m, k) => { mt += fitText(mx(k), my + 96, m, mw, { size: 12, weight: 700 }); });
  // правила
  const rl = bullets(RX + 20, y + 56, d.rule, RW - 40, 13, 18, 8);
  const rh = Math.max(156, rl.y - y + 4);
  mt = mt.replace(`height="0" rx="20"`, `height="${rh}" rx="20"`);
  b += `<g class="r" ${delay(3)}>${mt}</g><g class="r" ${delay(3.5)}>${card(RX, y, RW, rh, 20)}${label(RX + 20, y + 30, d.rules, RW - 40)}${rl.s}</g>`;
  y += rh + 16;
  // 7 тем
  const names = THEME_NAMES[lang === "ru" || lang === "uk" ? "ru" : "en"];
  let th = card(40, y, 800, 124, 20) + label(60, y + 30, d.themes, 760);
  const tw = (760 - 6 * 10) / 7;
  THEME_SW.forEach(([bg, ink], k) => {
    const x = 60 + k * (tw + 10);
    th += `<rect x="${x}" y="${y + 44}" width="${tw}" height="44" rx="8" fill="${k === 0 ? "url(#half)" : bg}" stroke="#fff" stroke-opacity=".14"/>` +
      (k === 0 ? "" : `<text class="m" x="${x + 10}" y="${y + 73}" font-size="17" font-weight="700" fill="${ink}">${T("Aa")}</text>`) +
      fitText(x, y + 108, names[k], tw, { size: 11, weight: 500, fill: P.muted });
  });
  b += `<g class="r" ${delay(4)}>${th}</g>`;
  return svg(W, y + 124 + 36, d.label + " — " + plain(d.title), b, HALF);
}

const strings = JSON.parse(fs.readFileSync(dir + "strings.json", "utf8"));
const md = JSON.parse(fs.readFileSync(dir + "md.json", "utf8"));
const cards2 = JSON.parse(fs.readFileSync(dir + "cards2.json", "utf8"));
const images = {};
for (const [lang, s] of Object.entries(strings)) {
  images[lang] = () => ({
    [`hero-${lang}.svg`]: heroSvg(s),
    [`sections-${lang}.svg`]: sectionsSvg(s),
    [`safe-${lang}.svg`]: safeSvg(s),
    [`btn-web-${lang}.svg`]: btnSvg(md[lang].btnWeb, "web"),
    [`btn-android-${lang}.svg`]: btnSvg(md[lang].btnApk, "android"),
    [`btn-windows-${lang}.svg`]: btnSvg(md[lang].btnWin, "windows"),
  });
}
await K.build(out, images, "Okto›↗↓↻/:.,");
console.log(Object.keys(strings).length + " языков, " + fs.readdirSync(out).length + " файлов");
renderPngs();

// ── README на всех языках из одного шаблона (tools/readme/md.json) ──
const langs = Object.keys(md);
for (const lang of langs) {
  const m = md[lang];
  const sw = langs.map((l) => (l === lang ? `**${md[l].name}**` : `[${md[l].name}](${md[l].file})`)).join(" · ");
  const text = `<div align="center">

${sw}

<br>

<picture><source srcset="assets/readme/hero-${lang}.svg"><img src="assets/readme/png/hero-${lang}.png" width="100%" alt="${m.alt[0]}"></picture>

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/btn-web-${lang}.svg" height="52" alt="${m.btnWeb}"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-${lang}.svg" height="52" alt="${m.btnApk}"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/tag/tray-v1.6"><img src="assets/readme/btn-windows-${lang}.svg" height="52" alt="${m.btnWin}"></a>

${m.anywhere}

</div>
${m.note ? `\n> [!NOTE]\n> ${m.note}\n` : ""}
<br>

<img src="assets/readme/screens-${lang === "ru" || lang === "uk" ? "ru" : "en"}.webp" width="100%" alt="${m.alt[2]}">

<br>

<picture><source srcset="assets/readme/sections-${lang}.svg"><img src="assets/readme/png/sections-${lang}.png" width="100%" alt="${m.alt[2]}"></picture>

<br>

<details>
<summary>${m.syncTitle}</summary>

${m.syncIntro}

${m.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${m.syncNote}

</details>

<br>

<picture><source srcset="assets/readme/safe-${lang}.svg"><img src="assets/readme/png/safe-${lang}.png" width="100%" alt="${m.alt[5]}"></picture>

<br>

## ${m.history}

${m.h30}

${m.h28}

${m.h21}

${m.h2}

${m.h1}

## ${m.license}

${m.lic}
`;
  fs.writeFileSync(m.file, text);
}
console.log("README: " + langs.map((l) => md[l].file).join(", "));
