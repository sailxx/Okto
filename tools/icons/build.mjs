// Значки Okto из одной геометрии: осьминог (основной) и кольцо (прежний, на выбор в Android).
// node tools/icons/build.mjs — пишет SVG/PNG для сайта и векторы для Android. PNG рендерит Chrome.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BG = "#17181b";
const FG = "#fafafa";
const root = path.resolve(import.meta.dirname, "../..");
const out = (p) => path.join(root, p);

// Осьминог в кадре 512×512, центр рисунка — (256, 257)
const O = {
  head: { cx: 256, cy: 203, r: 80 },
  eyes: [{ cx: 229, cy: 196 }, { cx: 283, cy: 196 }],
  eyeR: 14,
  arm: 26, // толщина щупальца
  gap: 8, // тёмный зазор между головой и щупальцами
  arms: [
    [200, 255, 184, 328, 141, 333],
    [229, 271, 223, 341, 204, 378],
    [283, 271, 289, 341, 308, 378],
    [312, 255, 328, 328, 371, 333],
  ],
};

const n = (v) => +v.toFixed(2);
const circle = (cx, cy, r) => `M${n(cx - r)},${n(cy)}a${n(r)},${n(r)} 0 1,1 ${n(2 * r)},0a${n(r)},${n(r)} 0 1,1 ${n(-2 * r)},0z`;

/** Осьминог, пересчитанный в другой кадр: x' = ox + (x - 256)·k, y' = oy + (y - 257)·k */
function octo(k, ox, oy) {
  const X = (x) => ox + (x - 256) * k;
  const Y = (y) => oy + (y - 257) * k;
  const { head: h } = O;
  return {
    arms: O.arms.map(([x1, y1, cx, cy, x2, y2]) => `M${n(X(x1))},${n(Y(y1))}Q${n(X(cx))},${n(Y(cy))} ${n(X(x2))},${n(Y(y2))}`),
    outline: circle(X(h.cx), Y(h.cy), h.r * k), // обводка цветом фона = зазор у щупалец
    // Голова с глазами-дырками (evenOdd): глаза прозрачные, фон виден и в монохромном значке
    head: circle(X(h.cx), Y(h.cy), h.r * k) + O.eyes.map((e) => circle(X(e.cx), Y(e.cy), O.eyeR * k)).join(""),
    arm: n(O.arm * k),
    gap: n(O.gap * k),
  };
}

function octoSvg(size, { k, ox, oy, rx }) {
  const o = octo(k, ox, oy);
  const bg = rx === null ? "" : `<rect width="${size}" height="${size}"${rx ? ` rx="${rx}"` : ""} fill="${BG}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${bg}` +
    `<path d="${o.arms.join("")}" fill="none" stroke="${FG}" stroke-width="${o.arm}" stroke-linecap="round"/>` +
    `<path d="${o.head}" fill="${FG}" fill-rule="evenodd" stroke="${BG}" stroke-width="${o.gap}" paint-order="stroke"/></svg>\n`;
}

const ringSvg = (size, rx, r, w) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}"${rx ? ` rx="${rx}"` : ""} fill="${BG}"/>` +
  `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${FG}" stroke-width="${w}"/></svg>\n`;

// ===== Сайт =====
const icon = { k: 1.32, ox: 256, oy: 256, rx: 112 }; // «any»: скруглённый квадрат, рисунок крупно
const maskable = { k: 1.15, ox: 256, oy: 256, rx: 0 }; // безопасная зона — круг 80%
fs.writeFileSync(out("public/assets/favicon.svg"), octoSvg(64, { k: 0.185, ox: 32, oy: 32, rx: 16 }).replace(/\n$/, ""));
fs.writeFileSync(out("assets/logo/okto-logo.svg"), octoSvg(512, icon));
fs.writeFileSync(out("assets/logo/okto-ring.svg"), ringSvg(512, 112, 112, 56));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "okto-icons-"));
function png(svg, size, file) {
  const html = path.join(tmp, "i.html");
  fs.writeFileSync(html, `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  const shot = path.join(tmp, "i.png");
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--default-background-color=00000000", `--window-size=${size},${size}`, `--screenshot=${shot}`, "file:///" + html.replace(/\\/g, "/")], { stdio: "ignore" });
  fs.copyFileSync(shot, out(file));
}
const iconSvg = octoSvg(512, icon);
const maskSvg = octoSvg(512, maskable);
png(iconSvg, 512, "public/assets/icon-512.png");
png(iconSvg, 192, "public/assets/icon-192.png");
png(octoSvg(512, { ...icon, rx: 0 }), 180, "public/assets/icon-180.png"); // iOS скругляет сам
png(maskSvg, 512, "public/assets/icon-maskable-512.png");
png(maskSvg, 192, "public/assets/icon-maskable-192.png");
png(iconSvg, 512, "assets/logo/okto-logo-512.png");
fs.rmSync(tmp, { recursive: true, force: true });

// ===== Android =====
const res = (p) => out("android/app/src/main/res/" + p);
const vector = (comment, w, vp, body) => `<?xml version="1.0" encoding="utf-8"?>
<!-- ${comment} — сгенерировано tools/icons/build.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${w}dp"
    android:height="${w}dp"
    android:viewportWidth="${vp}"
    android:viewportHeight="${vp}">
${body}</vector>
`;
function octoVector(k, c, gapColor) {
  const o = octo(k, c, c);
  return `    <path
        android:pathData="${o.arms.join("")}"
        android:strokeWidth="${o.arm}"
        android:strokeColor="#FFFAFAFA"
        android:strokeLineCap="round" />
    <path
        android:pathData="${o.outline}"
        android:strokeWidth="${o.gap}"
        android:strokeColor="${gapColor}" />
    <path
        android:fillColor="#FFFAFAFA"
        android:fillType="evenOdd"
        android:pathData="${o.head}" />
`;
}
// Адаптивный значок 108dp: рисунок ~54dp, внутри безопасного круга 66dp
fs.writeFileSync(res("drawable/ic_launcher_foreground.xml"), vector("Осьминог Okto", 108, 108, octoVector(0.2, 54, "#FF17181B")));
// Заставка TWA: скруглённый квадрат, как favicon
fs.writeFileSync(res("drawable/splash.xml"), vector("Заставка: осьминог Okto", 96, 64, `    <path
        android:fillColor="#FF17181B"
        android:pathData="M16,0h32a16,16 0,0 1,16 16v32a16,16 0,0 1,-16 16h-32a16,16 0,0 1,-16 -16v-32a16,16 0,0 1,16 -16z" />
` + octoVector(0.165, 32, "#FF17181B")));

console.log("ok");
