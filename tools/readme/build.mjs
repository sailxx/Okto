// Картинки README: чёрно-белые плашки Okto в шрифте JetBrains Mono, важные слова — красные.
// Шрифт (OFL-1.1, github.com/JetBrains/JetBrainsMono) положить в tools/readme/.font/JetBrainsMono-Var.woff2
// Строки — tools/readme/strings.json, *слово* — красное. Запуск: node tools/readme/build.mjs
import fs from "node:fs";
import { renderPngs } from "./png.mjs";

const dir = "tools/readme/";
// Версия Android-приложения для подписи плашки — из android/app/build.gradle.kts, чтобы не устаревала
const VERSION = fs.readFileSync("android/app/build.gradle.kts", "utf8").match(/versionName = "([^"]+)"/)[1];
const out = "assets/readme/";
fs.mkdirSync(out, { recursive: true });
const font = fs.readFileSync(dir + ".font/JetBrainsMono-Var.woff2").toString("base64");
const FACE = `@font-face{font-family:"JBM";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 800}`;

const RED = "#d33a3f", INK = "#141414", WHITE = "#ffffff", SOFT = "#f6f6f4", LINE = "#e4e4e1", MUTED = "#5f5f5c", DIM = "#8b8b87";
const W = 880, P = 40;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (s) => String(s).replace(/\*/g, "");

// Перенос по словам: шрифт моноширинный, поэтому длину считаем в знаках (без звёздочек)
function wrap(text, max) {
  const lines = [];
  let cur = [];
  for (const w of String(text).split(" ")) {
    const len = plain([...cur, w].join(" ")).length;
    if (cur.length && len > max) { lines.push(cur); cur = [w]; } else cur.push(w);
  }
  if (cur.length) lines.push(cur);
  return lines;
}
// Слова между *звёздочками* красятся в красный; состояние тянется через строки
function richLines(text, max, base) {
  const out = [];
  let red = false;
  for (const words of wrap(text, max)) {
    out.push(words.map((w, i) => {
      const opens = w.startsWith("*"), closes = w.replace(/[.,:;!?»”“«]+$/, "").endsWith("*");
      const isRed = red || opens;
      if (opens && !closes) red = true;
      if (closes) red = false;
      return `<tspan fill="${isRed ? RED : base}">${esc((i ? " " : "") + plain(w))}</tspan>`;
    }).join(""));
  }
  return out;
}

const svg = (h, label, body, dark) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}">
<style>
${FACE}
text{font-family:"JBM",ui-monospace,Consolas,monospace}
.lb{font-size:11px;font-weight:600;letter-spacing:2.4px}
.r{animation:in .8s cubic-bezier(.2,.8,.2,1) backwards}
.blink{animation:blink 1s steps(1) infinite}
@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes blink{50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){.r,.blink{animation:none}}
</style>
<defs><clipPath id="card"><rect width="${W}" height="${h}" rx="22"/></clipPath>
<pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="${dark ? "#ffffff" : INK}" fill-opacity="${dark ? ".06" : ".06"}"/></pattern></defs>
<g clip-path="url(#card)"><rect width="${W}" height="${h}" fill="${dark ? "#111111" : WHITE}"/><rect width="${W}" height="${h}" fill="url(#grid)"/></g>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="21.5" fill="none" stroke="${dark ? "#ffffff" : INK}" stroke-opacity="${dark ? ".1" : ".12"}"/>
${body}
</svg>`;
const delay = (s) => ` style="animation-delay:${s}s"`;
const textBlock = (x, y, lines, size, lh, base, extra = "") => lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}"${extra}>${l}</text>`).join("");

// Табло фокуса: семь сегментов не рисуем — крупные цифры JetBrains Mono, как в самом Okto
function heroSvg(s) {
  let y = 50;
  let b = `<g class="r"><circle cx="${P + 8}" cy="${y - 7}" r="7" fill="#e9e9e6"/><text x="${P + 24}" y="${y}" font-size="24" font-weight="800" letter-spacing="-.8" fill="${WHITE}">okto</text>` +
    `<text x="${W - P}" y="${y - 2}" text-anchor="end" class="lb" fill="${DIM}">v2.0</text></g>`;
  y = 98;
  b += `<text x="${P}" y="${y}" class="lb r" fill="${DIM}"${delay(0.1)}>${esc(s.tag)}</text>`;
  const t1 = richLines(s.l1, 46, WHITE), t2 = richLines(s.l2, 46, WHITE);
  y += 44;
  b += `<g class="r" font-weight="800" letter-spacing="-.8"${delay(0.2)}>` + textBlock(P, y, [...t1, ...t2], 28, 38, WHITE) + `</g>`;
  y += (t1.length + t2.length - 1) * 38 + 40;
  // Описание слева, табло справа
  const sub = richLines(s.sub, 50, "#bdbdb8");
  b += `<g class="r"${delay(0.3)}>` + textBlock(P, y + 4, sub, 14, 22, "#bdbdb8") + `</g>`;
  const wx = 500, wy = y - 22, ww = W - P - wx, wh = 124;
  b += `<g class="r"${delay(0.35)}><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="12" fill="#000" stroke="#ffffff" stroke-opacity=".12"/>` +
    `<circle cx="${wx + 18}" cy="${wy + 20}" r="3.5" fill="${RED}"/><text x="${wx + 28}" y="${wy + 24}" font-size="9.5" font-weight="700" letter-spacing="2" fill="${DIM}">${esc(s.disp)}</text>` +
    `<text x="${wx + 18}" y="${wy + 82}" font-size="56" font-weight="800" letter-spacing="-2" fill="${RED}">25<tspan class="blink">:</tspan>00</text>` +
    Array.from({ length: 16 }, (_, i) => `<rect x="${wx + 18 + i * 18.6}" y="${wy + 94}" width="15" height="5" rx="1.5" fill="${i < 6 ? RED : "#ffffff"}" fill-opacity="${i < 6 ? 1 : 0.12}"/>`).join("") +
    `<text x="${wx + 18}" y="${wy + 114}" font-size="9" fill="${DIM}">${esc(s.next)}</text><text x="${wx + ww - 18}" y="${wy + 114}" text-anchor="end" font-size="9" fill="${DIM}">25/5</text></g>`;
  y = wy + wh + 24;
  // Четыре плитки
  const TW = (W - 2 * P - 36) / 4;
  const tiles = s.tiles.map(([t, d]) => ({ t: richLines(t, 18, WHITE), d: richLines(d, 22, "#a8a8a3") }));
  const th = Math.max(...tiles.map((x) => 22 + x.t.length * 19 + 8 + x.d.length * 17 + 12));
  tiles.forEach((x, i) => {
    const X = P + i * (TW + 12);
    b += `<g class="r"${delay(0.45 + i * 0.1)}><rect x="${X}" y="${y}" width="${TW}" height="${th}" rx="12" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>` +
      `<g font-weight="700">${textBlock(X + 16, y + 30, x.t, 14, 19, WHITE)}</g>` + textBlock(X + 16, y + 30 + x.t.length * 19 + 8, x.d, 12, 17, "#a8a8a3") + `</g>`;
  });
  const h = y + th + P;
  return svg(h, `Okto — ${plain(s.l1)} ${plain(s.l2)} ${s.sub}`, b, true);
}

// Иллюстрации-табло для разделов (тёмный экран 352×112)
function illo(kind, s, x, y, w) {
  const h = 112;
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${INK}"/>`;
  if (kind === "home") {
    g += `<text x="${x + 14}" y="${y + 22}" font-size="9" font-weight="700" letter-spacing="1.8" fill="${DIM}">${esc(s.home[3])}</text>` +
      `<text x="${x + 14}" y="${y + 80}" font-size="46" font-weight="800" letter-spacing="-1.5" fill="#f3f3f1">03<tspan fill="${DIM}">/</tspan>05</text>`;
    const hs = [18, 30, 22, 40, 26, 48, 34, 20, 44, 52, 38, 28, 46, 60];
    hs.forEach((v, i) => { g += `<rect x="${x + 182 + i * 11.5}" y="${y + 92 - v}" width="7.5" height="${v}" rx="1.5" fill="${i === hs.length - 1 ? RED : "#f3f3f1"}" fill-opacity="${i === hs.length - 1 ? 1 : 0.28 + i * 0.03}"/>`; });
  } else if (kind === "tasks") {
    const names = s.tasks[3];
    names.forEach((n, i) => {
      const ry = y + 26 + i * 30, done = i === 0;
      g += `<rect x="${x + 14}" y="${ry - 11}" width="14" height="14" rx="4" fill="${done ? "#f3f3f1" : "none"}" stroke="#f3f3f1" stroke-opacity="${done ? 1 : 0.5}" stroke-width="1.4"/>` +
        (done ? `<path d="M${x + 17.5} ${ry - 4}l2.6 2.6 4.6-5" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` : "") +
        `<text x="${x + 38}" y="${ry}" font-size="11.5" fill="${done ? DIM : "#f3f3f1"}"${done ? ' text-decoration="line-through"' : ""}>${esc(n)}</text>` +
        (i === 1 ? `<circle cx="${x + w - 74}" cy="${ry - 4}" r="3.5" fill="${RED}"/><text x="${x + w - 14}" y="${ry}" text-anchor="end" font-size="10" fill="${DIM}">18:00</text>` : "") +
        (i === 2 ? `<text x="${x + w - 14}" y="${ry}" text-anchor="end" font-size="11" fill="${DIM}">↻ 7</text>` : "") +
        (i < 2 ? `<line x1="${x + 14}" y1="${ry + 10}" x2="${x + w - 14}" y2="${ry + 10}" stroke="#ffffff" stroke-opacity=".08"/>` : "");
    });
  } else if (kind === "calendar") {
    const cw = (w - 28) / 5;
    s.calendar[3].forEach((d, i) => {
      const cx = x + 14 + i * cw;
      g += `<text x="${cx + cw / 2}" y="${y + 20}" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1.2" fill="${i === 2 ? "#f3f3f1" : DIM}">${esc(d)}</text>` +
        (i ? `<line x1="${cx}" y1="${y + 28}" x2="${cx}" y2="${y + h - 10}" stroke="#ffffff" stroke-opacity=".08"/>` : "");
    });
    const blk = (col, top, len, red) => `<rect x="${x + 16 + col * cw}" y="${y + top}" width="${cw - 4}" height="${len}" rx="4" fill="${red ? RED : "#f3f3f1"}" fill-opacity="${red ? 0.9 : 0.85}"/>`;
    g += blk(0, 34, 26) + blk(1, 58, 36) + blk(2, 32, 20, true) + blk(3, 46, 44) + blk(4, 36, 22);
    g += `<line x1="${x + 14}" y1="${y + 70}" x2="${x + w - 14}" y2="${y + 70}" stroke="${RED}" stroke-width="1.6"/><circle cx="${x + 14}" cy="${y + 70}" r="3.5" fill="${RED}"/>`;
  } else if (kind === "focus") {
    g += `<text x="${x + 14}" y="${y + 74}" font-size="50" font-weight="800" letter-spacing="-2" fill="${RED}">25<tspan class="blink">:</tspan>00</text>`;
    ["25/5", "15/3", "50/10"].forEach((c, i) => {
      const cy = y + 18 + i * 28;
      g += `<rect x="${x + w - 84}" y="${cy}" width="70" height="22" rx="6" fill="#ffffff" fill-opacity="${i ? 0.08 : 0.9}"/><text x="${x + w - 49}" y="${cy + 15}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${i ? "#f3f3f1" : INK}">${c}</text>`;
    });
    g += Array.from({ length: 12 }, (_, i) => `<rect x="${x + 14 + i * 16}" y="${y + 90}" width="12" height="4" rx="1" fill="${i < 4 ? RED : "#ffffff"}" fill-opacity="${i < 4 ? 1 : 0.12}"/>`).join("");
  }
  return g;
}

function sectionsSvg(s) {
  let b = `<g class="r"><rect x="${P}" y="38" width="9" height="9" rx="2" fill="${RED}"/><text x="${P + 18}" y="47" class="lb" fill="${MUTED}">${esc(s.secLabel)}</text></g>`;
  const CW = (W - 2 * P - 16) / 2, IW = CW - 40;
  const cells = ["home", "tasks", "calendar", "focus"].map((k) => {
    const [name, title, bullets] = s[k];
    const t = richLines(title, 31, INK);
    const bl = bullets.map((x) => richLines(x, 45, "#2b2b29"));
    const bh = bl.reduce((a, l) => a + l.length * 18 + 6, 0);
    return { k, name, t, bl, h: 40 + t.length * 24 + 10 + 112 + 22 + bh + 10 };
  });
  let y = 66;
  for (let row = 0; row < 2; row++) {
    const rh = Math.max(cells[row * 2].h, cells[row * 2 + 1].h);
    for (let col = 0; col < 2; col++) {
      const c = cells[row * 2 + col], X = P + col * (CW + 16);
      let cy = y + 32;
      let g = `<rect x="${X}" y="${y}" width="${CW}" height="${rh}" rx="16" fill="${SOFT}" stroke="${LINE}"/>` +
        `<text x="${X + 20}" y="${cy}" class="lb" fill="${MUTED}">${esc(c.name)}</text>`;
      cy += 30;
      g += `<g font-weight="800" letter-spacing="-.4">${textBlock(X + 20, cy, c.t, 18, 24, INK)}</g>`;
      cy += (c.t.length - 1) * 24 + 16;
      g += illo(c.k, s, X + 20, cy, IW);
      cy += 112 + 26;
      for (const lines of c.bl) {
        g += `<text x="${X + 20}" y="${cy}" font-size="12" font-weight="800" fill="${RED}">›</text>` + textBlock(X + 34, cy, lines, 12, 18, "#2b2b29");
        cy += lines.length * 18 + 6;
      }
      b += `<g class="r"${delay(0.1 + (row * 2 + col) * 0.12)}>${g}</g>`;
    }
    y += rh + 16;
  }
  return svg(y - 16 + P - 6, s.secLabel, b, false);
}

const MORE_ICONS = {
  sync: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  privacy: '<rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1.3"/>',
  look: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  // Плашка «Android»
  widget: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="2"/><rect x="3.5" y="13" width="17" height="7.5" rx="2"/><path d="M7 16.8l1.3 1.2 2.4-2.4"/>',
  oneapp: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3"/><circle cx="12" cy="10" r="2.6"/>',
  fresh: '<path d="M12 3.5l2.1 5.4 5.4 2.1-5.4 2.1-2.1 5.4-2.1-5.4-5.4-2.1 5.4-2.1z"/><path d="M19 3.5v3M17.5 5h3"/>',
  // Безопасность
  sign: '<path d="M12 3l7.5 3v5.3c0 4.6-3.2 8.2-7.5 9.7-4.3-1.5-7.5-5.1-7.5-9.7V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.3"/>',
  data: '<rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><circle cx="12" cy="15" r="1.3"/>',
  perms: '<path d="M4 6.5h9M4 12h6M4 17.5h9"/><circle cx="17.5" cy="12" r="3.2"/><path d="M15.3 14.3l4.4-4.6"/>',
};
// Тёмная плашка из трёх колонок: иконка, подпись, заголовок и пункты; head — подпись над колонками
function cardsSvg(s, keys, head) {
  let b = "";
  const CW = (W - 2 * P - 24) / 3;
  const top = head ? P + 30 : P;
  if (head) b += `<text x="${P}" y="${P + 6}" class="lb r" fill="${DIM}">${esc(head)}</text>`;
  const cells = keys.map((k) => {
    const [name, title, bullets] = s[k];
    const t = richLines(title, 22, WHITE);
    const bl = bullets.map((x) => richLines(x, 30, "#bdbdb8"));
    return { k, name, t, bl, h: 70 + 26 + t.length * 22 + 14 + bl.reduce((a, l) => a + l.length * 17 + 6, 0) + 12 };
  });
  const rh = Math.max(...cells.map((c) => c.h));
  cells.forEach((c, i) => {
    const X = P + i * (CW + 12), y = top;
    let cy = y + 26;
    let g = `<rect x="${X}" y="${y}" width="${CW}" height="${rh}" rx="14" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>` +
      `<g transform="translate(${X + 18} ${cy - 6})" fill="none" color="${RED}" stroke="${RED}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${MORE_ICONS[c.k]}</g>`;
    cy += 44;
    g += `<text x="${X + 18}" y="${cy}" class="lb" fill="${DIM}">${esc(c.name)}</text>`;
    cy += 26;
    g += `<g font-weight="800" letter-spacing="-.3">${textBlock(X + 18, cy, c.t, 16, 22, WHITE)}</g>`;
    cy += (c.t.length - 1) * 22 + 26;
    for (const lines of c.bl) {
      g += `<text x="${X + 18}" y="${cy}" font-size="11.5" font-weight="800" fill="${RED}">›</text>` + textBlock(X + 31, cy, lines, 11.5, 17, "#bdbdb8");
      cy += lines.length * 17 + 6;
    }
    b += `<g class="r"${delay(0.1 + i * 0.12)}>${g}</g>`;
  });
  return svg(top + rh + P, (head ? head + " — " : "") + keys.map((k) => s[k][0]).join(" · "), b, true);
}
const moreSvg = (s) => cardsSvg(s, ["sync", "privacy", "look"]);
const androidSvg = (s) => cardsSvg(s, ["widget", "oneapp", "fresh"], s.appLabel.replace("{v}", VERSION));
const safeSvg = (s) => cardsSvg(s, ["sign", "data", "perms"], s.safeLabel);

// Кнопки под заставкой: «веб-версия» — тёмная с красной точкой, «Android» — светлая в рамке.
// Шрифт моноширинный (0,6 em = 9 px при 15 px), поэтому ширина считается по числу знаков.
const ANDROID_ICON = '<path d="M7 10.5a5 5 0 0 1 10 0v.5H7z"/><path d="M8.6 6.6 7.4 4.8M15.4 6.6l1.2-1.8"/><rect x="7" y="12.5" width="10" height="7" rx="1.6"/>';
function btnSvg(label, kind) {
  const web = kind === "web";
  const text = label + (web ? " ↗" : " ↓");
  const w = [...text].length * 9 + 76;
  const mark = web
    ? `<circle cx="26" cy="24" r="5" fill="${RED}"/>`
    : `<g transform="translate(14 12)" fill="none" stroke="${RED}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ANDROID_ICON}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="48" viewBox="0 0 ${w} 48" role="img" aria-label="${esc(label)}">
<style>${FACE}text{font-family:"JBM",ui-monospace,Consolas,monospace}</style>
<rect x=".75" y=".75" width="${w - 1.5}" height="46.5" rx="12" fill="${web ? INK : WHITE}" stroke="${INK}" stroke-width="1.5"/>
${mark}
<text x="44" y="30" font-size="15" font-weight="800" letter-spacing="-.2" fill="${web ? WHITE : INK}">${esc(text)}</text>
</svg>`;
}

// ── Качество в цифрах: настоящие данные из npm test и npm run build (версия 2.0) ──
// Тесты по файлам tests/*.test.ts: recurrence 9, merge 7, migrate 5, stats 5, layout 3, settings 2
const TESTS = [9, 7, 5, 5, 3, 2];
// gzip из vite build: index.js 63,5 КБ, index.css 10,65 КБ; чанки Firebase грузятся только при синхронизации — 165,3 КБ
const SIZES = [63.5, 10.65, 165.3];
const num = (v, lang) => (lang === "en" ? String(v) : String(v).replace(".", ","));

function qualitySvg(c, lang) {
  const q = c.q;
  let b = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#ffffff" fill-opacity=".06"/><line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" stroke-opacity=".35" stroke-width="2"/></pattern></defs>`;
  b += `<g class="r"><rect x="${P}" y="38" width="9" height="9" rx="2" fill="${RED}"/><text x="${P + 18}" y="47" class="lb" fill="${DIM}">${esc(q.label)}</text></g>`;
  const tl = richLines(q.title, 58, WHITE);
  b += `<g class="r" font-weight="800" letter-spacing="-.5"${delay(0.1)}>${textBlock(P, 84, tl, 22, 30, WHITE)}</g>`;
  let y = 84 + (tl.length - 1) * 30 + 30;
  const PW = (W - 2 * P - 16) / 2, PH = 300;
  const panel = (x, inner, d) => `<g class="r"${delay(d)}><rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="14" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>${inner}</g>`;

  // Тесты по модулям
  let L = `<text x="${P + 20}" y="${y + 30}" class="lb" fill="${DIM}">${esc(q.tests.toUpperCase())}</text>` +
    `<text x="${P + 20}" y="${y + 76}" font-size="40" font-weight="800" letter-spacing="-1.5" fill="${WHITE}">31<tspan fill="${DIM}">/</tspan>31</text>` +
    `<text x="${P + 152}" y="${y + 72}" font-size="13" fill="#bdbdb8">${esc(q.pass)} · <tspan fill="${RED}" font-weight="800">100%</tspan></text>`;
  const bw = PW - 40 - 34;
  TESTS.forEach((v, i) => {
    const ry = y + 106 + i * 31;
    const w = bw * v / 9;
    L += `<text x="${P + 20}" y="${ry}" font-size="11" fill="#bdbdb8">${esc(q.mods[i])}</text>` +
      `<rect x="${P + 20}" y="${ry + 6}" width="${w.toFixed(1)}" height="9" rx="2" fill="#ffffff" fill-opacity="${i === 0 ? 1 : 0.55}"/>` +
      `<text x="${(P + 27 + w).toFixed(1)}" y="${ry + 14.5}" font-size="11" font-weight="700" fill="${WHITE}">${v}</text>`;
  });
  b += panel(P, L, 0.2);

  // Вес приложения
  const X2 = P + PW + 16;
  const first = wrap(q.first, 28).map((w) => esc(w.join(" ")));
  let R = `<text x="${X2 + 20}" y="${y + 30}" class="lb" fill="${DIM}">${esc(q.weight.toUpperCase())}</text>` +
    `<text x="${X2 + 20}" y="${y + 76}" font-size="40" font-weight="800" letter-spacing="-1.5" fill="${RED}">74<tspan font-size="18" fill="${WHITE}"> ${esc(q.kb)}</tspan></text>` +
    first.map((l, i) => `<text x="${X2 + 152}" y="${y + 58 + i * 15}" font-size="11" fill="#bdbdb8">${l}</text>`).join("");
  const bw2 = PW - 40 - 84;
  SIZES.forEach((v, i) => {
    const ry = y + 122 + i * 54;
    const w = Math.max(6, bw2 * v / 165.3);
    const lazy = i === 2;
    const fill = lazy ? `fill="url(#hatch)" stroke="#ffffff" stroke-opacity=".35"` : `fill="#ffffff" fill-opacity="${i === 0 ? 1 : 0.55}"`;
    R += `<text x="${X2 + 20}" y="${ry}" font-size="11" fill="#bdbdb8">${esc(q.parts[i])}</text>` +
      `<rect x="${X2 + 20}" y="${ry + 8}" width="${w.toFixed(1)}" height="16" rx="3" ${fill}/>` +
      `<text x="${(X2 + 28 + w).toFixed(1)}" y="${ry + 20.5}" font-size="11" font-weight="700" fill="${lazy ? DIM : WHITE}">${num(v, lang)} ${esc(q.kb)}</text>`;
  });
  b += panel(X2, R, 0.3);
  y += PH + 16;

  // Плитки: что умеет приложение
  const TW = (W - 2 * P - 48) / 5;
  const tiles = q.tiles.map(([n, t]) => ({ n, t: wrap(t, 15).map((w) => esc(w.join(" "))) }));
  const th = Math.max(...tiles.map((x) => 62 + x.t.length * 15 + 10));
  tiles.forEach((x, i) => {
    const X = P + i * (TW + 12);
    b += `<g class="r"${delay(0.4 + i * 0.08)}><rect x="${X}" y="${y}" width="${TW}" height="${th}" rx="12" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>` +
      `<text x="${X + 16}" y="${y + 46}" font-size="32" font-weight="800" letter-spacing="-1" fill="${x.n === "0" ? RED : WHITE}">${esc(x.n)}</text>` +
      x.t.map((l, k) => `<text x="${X + 16}" y="${y + 68 + k * 15}" font-size="11" fill="#bdbdb8">${l}</text>`).join("") + `</g>`;
  });
  y += th + 24;
  b += `<text x="${P}" y="${y}" font-size="10" fill="${DIM}">${esc(q.src)}</text>`;
  return svg(y + 28, q.label + " — " + plain(q.title), b, true);
}

// ── Дизайн-код: значения из DESIGN.md ──
const GOLOS_CYR = fs.readFileSync(dir + ".font/golos-cyr-700.woff2").toString("base64");
const GOLOS_LAT = fs.readFileSync(dir + ".font/golos-lat-700.woff2").toString("base64");
const GOLOS = `@font-face{font-family:"Golos";src:url(data:font/woff2;base64,${GOLOS_CYR}) format("woff2");font-weight:700;unicode-range:U+0400-045F,U+0490-0491,U+2116}` +
  `@font-face{font-family:"Golos";src:url(data:font/woff2;base64,${GOLOS_LAT}) format("woff2");font-weight:700;unicode-range:U+0000-00FF}`;
const PALETTE = ["#FFFFFF", "#141414", "#F1F1EF", "#E4E4E1", "#D33A3F"];
const THEME_SW = [["#ffffff", "#141414"], ["#ffffff", "#141414"], ["#141414", "#ededed"], ["#e9e2d1", "#2a251b"], ["#e1eae3", "#14241a"], ["#0f141d", "#e2e7f0"], ["#000000", "#f4f4f4"]];
const THEME_NAMES = { ru: ["Системная", "Светлая", "Тёмная", "Бумага", "Мята", "Полночь", "OLED"], en: ["System", "Light", "Dark", "Paper", "Mint", "Midnight", "OLED"] };

function designSvg(c, lang) {
  const d = c.d;
  let b = `<defs><linearGradient id="half" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="#ffffff"/><stop offset=".5" stop-color="#141414"/></linearGradient></defs>`;
  b += `<g class="r"><rect x="${P}" y="38" width="9" height="9" rx="2" fill="${RED}"/><text x="${P + 18}" y="47" class="lb" fill="${MUTED}">${esc(d.label)}</text></g>`;
  const tl = richLines(d.title, 50, INK);
  b += `<g class="r" font-weight="800" letter-spacing="-.6"${delay(0.1)}>${textBlock(P, 88, tl, 26, 34, INK)}</g>`;
  let y = 88 + (tl.length - 1) * 34 + 28;
  const sub = wrap(d.sub, 88).map((w) => esc(w.join(" ")));
  b += `<g class="r"${delay(0.15)}>` + sub.map((l, i) => `<text x="${P}" y="${y + i * 20}" font-size="13" fill="#3a3a38">${l}</text>`).join("") + `</g>`;
  y += (sub.length - 1) * 20 + 28;
  const box = (x, yy, w, h, inner, dl) => `<g class="r"${delay(dl)}><rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="14" fill="${SOFT}" stroke="${LINE}"/>${inner}</g>`;
  const LW = 476, RW = W - 2 * P - LW - 16, RX = P + LW + 16;

  // Палитра
  let pal = `<text x="${P + 20}" y="${y + 28}" class="lb" fill="${MUTED}">${esc(d.palette)}</text>`;
  const sw = (LW - 40 - 4 * 10) / 5;
  PALETTE.forEach((hex, k) => {
    const x = P + 20 + k * (sw + 10);
    pal += `<rect x="${x}" y="${y + 42}" width="${sw}" height="58" rx="8" fill="${hex}" stroke="${INK}" stroke-opacity=".14"/>` +
      `<text x="${x}" y="${y + 118}" font-size="11" font-weight="700" fill="${k === 4 ? RED : INK}">${esc(d.colors[k])}</text>` +
      `<text x="${x}" y="${y + 133}" font-size="9.5" fill="${MUTED}">${hex}</text>`;
  });
  b += box(P, y, LW, 152, pal, 0.2);

  // Шрифты
  const ty = `<text x="${RX + 20}" y="${y + 28}" class="lb" fill="${MUTED}">${esc(d.type)}</text>` +
    `<text x="${RX + 20}" y="${y + 74}" font-size="34" font-weight="800" letter-spacing="-1.2" fill="${INK}">25:00</text>` +
    `<text x="${RX + 140}" y="${y + 58}" font-size="10.5" font-weight="700" fill="${INK}">JetBrains Mono</text>` +
    wrap(d.mono, 20).map((w, i) => `<text x="${RX + 140}" y="${y + 73 + i * 13}" font-size="10" fill="${MUTED}">${esc(w.join(" "))}</text>`).join("") +
    `<text x="${RX + 20}" y="${y + 128}" font-size="34" font-weight="700" letter-spacing="-1" fill="${INK}" style="font-family:Golos,system-ui,sans-serif">Аа Bb</text>` +
    `<text x="${RX + 140}" y="${y + 112}" font-size="10.5" font-weight="700" fill="${INK}">Golos Text</text>` +
    wrap(d.sans, 20).map((w, i) => `<text x="${RX + 140}" y="${y + 127 + i * 13}" font-size="10" fill="${MUTED}">${esc(w.join(" "))}</text>`).join("");
  b += box(RX, y, RW, 152, ty, 0.3);
  y += 168;

  // Материалы: корпус, клавиша, утопленное табло с «призрачными» восьмёрками
  let mt = `<text x="${P + 20}" y="${y + 28}" class="lb" fill="${MUTED}">${esc(d.mat)}</text>`;
  const mw = (LW - 40 - 2 * 14) / 3, my = y + 44;
  const mx = (k) => P + 20 + k * (mw + 14);
  mt += `<rect x="${mx(0)}" y="${my}" width="${mw}" height="74" rx="10" fill="#ffffff" stroke="${LINE}"/>` +
    `<circle cx="${mx(0) + 16}" cy="${my + 16}" r="4" fill="${INK}"/><text x="${mx(0) + 26}" y="${my + 20}" font-size="11" font-weight="800" fill="${INK}">okto</text>`;
  mt += `<rect x="${mx(1)}" y="${my}" width="${mw}" height="74" rx="10" fill="${LINE}" fill-opacity=".55"/>` +
    `<rect x="${mx(1) + 22}" y="${my + 14}" width="${mw - 44}" height="46" rx="10" fill="#cfcfcc"/>` +
    `<rect x="${mx(1) + 22}" y="${my + 11}" width="${mw - 44}" height="46" rx="10" fill="#ffffff"/>` +
    `<line x1="${mx(1) + 30}" y1="${my + 11.6}" x2="${mx(1) + mw - 30}" y2="${my + 11.6}" stroke="#ffffff"/>` +
    `<text x="${mx(1) + mw / 2}" y="${my + 41}" text-anchor="middle" font-size="20" font-weight="700" fill="${INK}">+</text>`;
  mt += `<rect x="${mx(2)}" y="${my}" width="${mw}" height="74" rx="10" fill="#f1f1ef" stroke="${INK}" stroke-opacity=".13"/>` +
    `<rect x="${mx(2) + 1}" y="${my + 1}" width="${mw - 2}" height="6" rx="9" fill="${INK}" fill-opacity=".05"/>` +
    `<text x="${mx(2) + 14}" y="${my + 54}" font-size="34" font-weight="800" letter-spacing="-1" fill="${INK}" fill-opacity=".07">88</text>` +
    `<text x="${mx(2) + 14}" y="${my + 54}" font-size="34" font-weight="800" letter-spacing="-1" fill="#111111">25</text>`;
  d.mats.forEach((m, k) => { mt += `<text x="${mx(k)}" y="${my + 94}" font-size="11" font-weight="700" fill="${INK}">${esc(m)}</text>`; });

  // Правила
  let rl = `<text x="${RX + 20}" y="${y + 28}" class="lb" fill="${MUTED}">${esc(d.rules)}</text>`;
  let ry = y + 52;
  d.rule.forEach((r) => {
    const lines = richLines(r, 30, INK);
    rl += `<text x="${RX + 20}" y="${ry}" font-size="11.5" font-weight="800" fill="${RED}">›</text>` + textBlock(RX + 33, ry, lines, 11.5, 16, INK);
    ry += lines.length * 16 + 8;
  });
  const rh = Math.max(152, ry - y + 4);
  b += box(P, y, LW, rh, mt, 0.4) + box(RX, y, RW, rh, rl, 0.5);
  y += rh + 16;

  // 7 тем
  const names = THEME_NAMES[lang === "ru" || lang === "uk" ? "ru" : "en"];
  let th = `<text x="${P + 20}" y="${y + 28}" class="lb" fill="${MUTED}">${esc(d.themes)}</text>`;
  const tw = (W - 2 * P - 40 - 6 * 10) / 7;
  THEME_SW.forEach(([bg, ink], k) => {
    const x = P + 20 + k * (tw + 10);
    th += `<rect x="${x}" y="${y + 42}" width="${tw}" height="44" rx="8" fill="${k === 0 ? "url(#half)" : bg}" stroke="${INK}" stroke-opacity=".14"/>` +
      (k === 0 ? "" : `<text x="${x + 10}" y="${y + 71}" font-size="17" font-weight="800" fill="${ink}">Aa</text>`) +
      `<text x="${x}" y="${y + 104}" font-size="10.5" fill="${INK}">${esc(names[k])}</text>`;
  });
  b += box(P, y, W - 2 * P, 120, th, 0.6);
  y += 120 + P - 4;
  return svg(y, d.label + " — " + plain(d.title), b, false).replace("</style>", GOLOS + "\n</style>");
}

const strings = JSON.parse(fs.readFileSync(dir + "strings.json", "utf8"));
const md = JSON.parse(fs.readFileSync(dir + "md.json", "utf8"));
const cards2 = JSON.parse(fs.readFileSync(dir + "cards2.json", "utf8"));
for (const [lang, s] of Object.entries(strings)) {
  fs.writeFileSync(`${out}hero-${lang}.svg`, heroSvg(s));
  fs.writeFileSync(`${out}sections-${lang}.svg`, sectionsSvg(s));
  fs.writeFileSync(`${out}more-${lang}.svg`, moreSvg(s));
  fs.writeFileSync(`${out}android-${lang}.svg`, androidSvg(s));
  fs.writeFileSync(`${out}safe-${lang}.svg`, safeSvg(s));
  const m = md[lang];
  fs.writeFileSync(`${out}btn-web-${lang}.svg`, btnSvg(m.btnWeb, "web"));
  fs.writeFileSync(`${out}btn-android-${lang}.svg`, btnSvg(m.btnApk, "android"));
  fs.writeFileSync(`${out}quality-${lang}.svg`, qualitySvg(cards2[lang], lang));
  fs.writeFileSync(`${out}design-${lang}.svg`, designSvg(cards2[lang], lang));
}
console.log(Object.keys(strings).length + " языков, " + fs.readdirSync(out).length + " файлов");
renderPngs();

// ── README на всех языках из одного шаблона (tools/readme/md.json) ──
const langs = Object.keys(md);
for (const lang of langs) {
  const m = md[lang];
  const sw = langs.map((l) => (l === lang ? `**${md[l].name}**` : `[${md[l].name}](${md[l].file})`)).join(" · ");
  const sec = (k) => `### ${m[k][0]}\n\n${m[k][1]}\n`;
  const text = `<div align="center">

${sw}

<br>

<picture><source srcset="assets/readme/hero-${lang}.svg"><img src="assets/readme/png/hero-${lang}.png" width="100%" alt="${m.alt[0]}"></picture>

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/btn-web-${lang}.svg" height="48" alt="${m.btnWeb}"></a>&nbsp;&nbsp;<a href="https://github.com/sailxx/Okto/releases/latest/download/Okto.apk"><img src="assets/readme/btn-android-${lang}.svg" height="48" alt="${m.btnApk}"></a>

${m.anywhere}

</div>
${m.note ? `\n> [!NOTE]\n> ${m.note}\n` : ""}
<br>

<img src="assets/readme/screens-${lang === "ru" || lang === "uk" ? "ru" : "en"}.webp" width="100%" alt="${m.alt[2]}">

<br>

<picture><source srcset="assets/readme/android-${lang}.svg"><img src="assets/readme/png/android-${lang}.png" width="100%" alt="${m.alt[4]}"></picture>

<br>

<picture><source srcset="assets/readme/sections-${lang}.svg"><img src="assets/readme/png/sections-${lang}.png" width="100%" alt="${m.alt[2]}"></picture>

<details>
<summary>${m.more}</summary>

${["home", "tasks", "calendar", "focus"].map(sec).join("\n")}
</details>

<br>

<picture><source srcset="assets/readme/quality-${lang}.svg"><img src="assets/readme/png/quality-${lang}.png" width="100%" alt="${cards2[lang].q.label}"></picture>

<br>

<picture><source srcset="assets/readme/design-${lang}.svg"><img src="assets/readme/png/design-${lang}.png" width="100%" alt="${cards2[lang].d.label}"></picture>

<br>

<picture><source srcset="assets/readme/more-${lang}.svg"><img src="assets/readme/png/more-${lang}.png" width="100%" alt="${m.alt[3]}"></picture>

<details>
<summary>${m.syncTitle}</summary>

${m.syncIntro}

${m.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${m.syncNote}

</details>

<br>

<picture><source srcset="assets/readme/safe-${lang}.svg"><img src="assets/readme/png/safe-${lang}.png" width="100%" alt="${m.alt[5]}"></picture>

<br>

## ${m.dev}

\`\`\`bash
npm install
npm run dev      # http://localhost:5173
npm test         # ${m.devTests}
npm run check    # svelte-check
npm run build    # ${m.devBuild}
\`\`\`

${m.devEnv}

## ${m.history}

${m.h28}

${m.h21}

${m.h2}

${m.h1}

## ${m.license}

${m.lic}

<div align="center">
<br>
<sub>${m.footer}</sub>
</div>
`;
  fs.writeFileSync(m.file, text);
}
console.log("README: " + langs.map((l) => md[l].file).join(", "));
