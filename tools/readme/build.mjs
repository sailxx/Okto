// Картинки README: чёрно-белые плашки Okto в шрифте JetBrains Mono, важные слова — красные.
// Шрифт (OFL-1.1, github.com/JetBrains/JetBrainsMono) положить в tools/readme/.font/JetBrainsMono-Var.woff2
// Строки — tools/readme/strings.json, *слово* — красное. Запуск: node tools/readme/build.mjs
import fs from "node:fs";

const dir = "tools/readme/";
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
};
function moreSvg(s) {
  let b = "";
  const CW = (W - 2 * P - 24) / 3;
  const cells = ["sync", "privacy", "look"].map((k) => {
    const [name, title, bullets] = s[k];
    const t = richLines(title, 22, WHITE);
    const bl = bullets.map((x) => richLines(x, 30, "#bdbdb8"));
    return { k, name, t, bl, h: 70 + 26 + t.length * 22 + 14 + bl.reduce((a, l) => a + l.length * 17 + 6, 0) + 12 };
  });
  const rh = Math.max(...cells.map((c) => c.h));
  cells.forEach((c, i) => {
    const X = P + i * (CW + 12), y = P;
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
  return svg(P + rh + P, `${s.sync[0]} · ${s.privacy[0]} · ${s.look[0]}`, b, true);
}

function ctaSvg() {
  const label = "sailxx.github.io/Okto";
  const w = label.length * 9 + 76;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="48" viewBox="0 0 ${w} 48" role="img" aria-label="${label}">
<style>${FACE}text{font-family:"JBM",ui-monospace,Consolas,monospace}</style>
<rect x=".5" y=".5" width="${w - 1}" height="47" rx="12" fill="${INK}" stroke="${INK}"/>
<circle cx="26" cy="24" r="5" fill="${RED}"/>
<text x="42" y="30" font-size="15" font-weight="800" letter-spacing="-.2" fill="${WHITE}">${label} ↗</text>
</svg>`;
}

const strings = JSON.parse(fs.readFileSync(dir + "strings.json", "utf8"));
for (const [lang, s] of Object.entries(strings)) {
  fs.writeFileSync(`${out}hero-${lang}.svg`, heroSvg(s));
  fs.writeFileSync(`${out}sections-${lang}.svg`, sectionsSvg(s));
  fs.writeFileSync(`${out}more-${lang}.svg`, moreSvg(s));
}
fs.writeFileSync(out + "cta.svg", ctaSvg());
console.log(Object.keys(strings).length + " языков, " + fs.readdirSync(out).length + " файлов");

// ── README на всех языках из одного шаблона (tools/readme/md.json) ──
const md = JSON.parse(fs.readFileSync(dir + "md.json", "utf8"));
const langs = Object.keys(md);
for (const lang of langs) {
  const m = md[lang];
  const sw = langs.map((l) => (l === lang ? `**${md[l].name}**` : `[${md[l].name}](${md[l].file})`)).join(" · ");
  const sec = (k) => `### ${m[k][0]}\n\n${m[k][1]}\n`;
  const text = `<div align="center">

${sw}

<br>

<img src="assets/readme/hero-${lang}.svg" width="100%" alt="${m.alt[0]}">

<a href="https://sailxx.github.io/Okto/"><img src="assets/readme/cta.svg" height="44" alt="${m.alt[1]}"></a>

</div>
${m.note ? `\n> [!NOTE]\n> ${m.note}\n` : ""}
<br>

<img src="assets/readme/sections-${lang}.svg" width="100%" alt="${m.alt[2]}">

<details>
<summary><b>${m.more}</b></summary>

${["home", "tasks", "calendar", "focus"].map(sec).join("\n")}
</details>

<br>

<img src="assets/readme/more-${lang}.svg" width="100%" alt="${m.alt[3]}">

<details>
<summary><b>${m.syncTitle}</b></summary>

${m.syncIntro}

${m.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${m.syncNote}

</details>

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
