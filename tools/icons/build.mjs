// Значки Okto из одной геометрии: осьминог в стиле Okto Notes со стеклом (основной) и кольцо (прежний, на выбор в Android).
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

// Осьминог в кадре 104×104, центр рисунка — (52, 53.5)
const O = {
  head: { cx: 52, cy: 40, r: 25 },
  eyes: [{ cx: 43.5, cy: 37 }, { cx: 60.5, cy: 37 }],
  eyeR: 4.5,
  arm: 8, // толщина щупальца
  arms: [
    [36, 58, 28, 74, 16, 77],
    [47, 64, 44, 80, 37, 88],
    [57, 64, 60, 80, 67, 88],
    [68, 58, 76, 74, 88, 77],
  ],
};
const C = { x: 52, y: 53.5 };

const n = (v) => +v.toFixed(2);
const circle = (cx, cy, r) => `M${n(cx - r)},${n(cy)}a${n(r)},${n(r)} 0 1,1 ${n(2 * r)},0a${n(r)},${n(r)} 0 1,1 ${n(-2 * r)},0z`;

/** Осьминог, пересчитанный в другой кадр: x' = ox + (x - 52)·k, y' = oy + (y - 53.5)·k */
function octo(k, ox, oy) {
  const X = (x) => ox + (x - C.x) * k;
  const Y = (y) => oy + (y - C.y) * k;
  const { head: h } = O;
  const eyes = O.eyes.map((e) => circle(X(e.cx), Y(e.cy), O.eyeR * k)).join("");
  return {
    X, Y,
    arms: O.arms.map(([x1, y1, cx, cy, x2, y2]) => `M${n(X(x1))},${n(Y(y1))}Q${n(X(cx))},${n(Y(cy))} ${n(X(x2))},${n(Y(y2))}`).join(""),
    body: circle(X(h.cx), Y(h.cy), h.r * k),
    eyes,
    // Голова с глазами-дырками (evenOdd): глаза прозрачные, фон виден и в монохромном значке Android
    head: circle(X(h.cx), Y(h.cy), h.r * k) + eyes,
    arm: n(O.arm * k),
  };
}

/** Значок со стеклом в кадре 104: плитка с бликом и световым кантом, объёмный осьминог с тенью. rx = 0 — квадрат (iOS, maskable) */
function glassSvg({ k = 1, rx = 24 } = {}) {
  const o = octo(k, 52, 52 + (C.y - 52) * k);
  const hx = o.X(45), hy = o.Y(26); // блик на голове
  const tile = `<rect width="104" height="104"${rx ? ` rx="${rx}"` : ""}`;
  const rim = rx ? `<rect x=".75" y=".75" width="102.5" height="102.5" rx="${rx - 0.75}" fill="none" stroke="url(#or)" stroke-width="1.5"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104"><defs>` +
    `<linearGradient id="ob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2A2E"/><stop offset=".55" stop-color="#0E0E10"/><stop offset="1" stop-color="#000"/></linearGradient>` +
    `<linearGradient id="or" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".75" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".28"/></linearGradient>` +
    `<linearGradient id="os" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="of" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#DCDCE2"/></linearGradient>` +
    `<radialGradient id="op" cx=".32" cy=".22" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<filter id="oh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${n(3 * k)}"/></filter>` +
    `<clipPath id="oc">${tile}/></clipPath></defs>` +
    `${tile} fill="url(#ob)"/>` +
    `<path d="M0 0h104v38Q52 52 0 38z" fill="url(#os)" clip-path="url(#oc)"/>` +
    `<g opacity=".55" filter="url(#oh)" transform="translate(0 ${n(3 * k)})"><path d="${o.arms}" fill="none" stroke="#000" stroke-width="${o.arm}" stroke-linecap="round"/><path d="${o.body}"/></g>` +
    `<path d="${o.arms}" fill="none" stroke="url(#of)" stroke-width="${o.arm}" stroke-linecap="round"/>` +
    `<path d="${o.body}" fill="url(#of)"/>` +
    `<path d="${circle(o.X(O.head.cx), o.Y(O.head.cy), (O.head.r - 0.6) * k)}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="${n(1.2 * k)}"/>` +
    `<ellipse cx="${n(hx)}" cy="${n(hy)}" rx="${n(12 * k)}" ry="${n(6 * k)}" fill="url(#op)" transform="rotate(-20 ${n(hx)} ${n(hy)})"/>` +
    `<path d="${o.eyes}" fill="#000"/>${rim}</svg>\n`;
}

const ringSvg = (size, rx, r, w) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}"${rx ? ` rx="${rx}"` : ""} fill="${BG}"/>` +
  `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${FG}" stroke-width="${w}"/></svg>\n`;

// ===== Сайт =====
const iconSvg = glassSvg(); // «any»: скруглённый квадрат, рисунок крупно
const maskSvg = glassSvg({ k: 0.78, rx: 0 }); // безопасная зона — круг 80%
fs.writeFileSync(out("public/assets/favicon.svg"), iconSvg.replace(/\n$/, ""));
fs.writeFileSync(out("assets/logo/okto-logo.svg"), iconSvg);
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
png(iconSvg, 512, "public/assets/icon-512.png");
png(iconSvg, 192, "public/assets/icon-192.png");
png(glassSvg({ rx: 0 }), 180, "public/assets/icon-180.png"); // iOS скругляет сам
png(maskSvg, 512, "public/assets/icon-maskable-512.png");
png(maskSvg, 192, "public/assets/icon-maskable-192.png");
png(iconSvg, 512, "assets/logo/okto-logo-512.png");
fs.rmSync(tmp, { recursive: true, force: true });

// ===== Android =====
const res = (p) => out("android/app/src/main/res/" + p);
const vector = (comment, w, vp, body) => `<?xml version="1.0" encoding="utf-8"?>
<!-- ${comment} — сгенерировано tools/icons/build.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="${w}dp"
    android:height="${w}dp"
    android:viewportWidth="${vp}"
    android:viewportHeight="${vp}">
${body}</vector>
`;
const grad = (attr, y1, y2, stops) => `        <aapt:attr name="android:${attr}">
            <gradient
                android:type="linear"
                android:startX="0"
                android:startY="${n(y1)}"
                android:endX="0"
                android:endY="${n(y2)}">
${stops.map(([o, c]) => `                <item android:offset="${o}" android:color="${c}" />`).join("\n")}
            </gradient>
        </aapt:attr>
`;
const TILE = [["0", "#FF2A2A2E"], ["0.55", "#FF0E0E10"], ["1", "#FF000000"]];
const BODY = [["0", "#FFFFFFFF"], ["1", "#FFDCDCE2"]];
function octoVector(k, c) {
  const o = octo(k, c, c);
  const top = o.Y(15), bottom = o.Y(92);
  return `    <path
        android:pathData="${o.arms}"
        android:strokeWidth="${o.arm}"
        android:strokeLineCap="round">
${grad("strokeColor", top, bottom, BODY)}    </path>
    <path
        android:fillType="evenOdd"
        android:pathData="${o.head}">
${grad("fillColor", top, bottom, BODY)}    </path>
`;
}
// Адаптивный значок 108dp: рисунок ~55dp, внутри безопасного круга 66dp
fs.writeFileSync(res("drawable/ic_launcher_foreground.xml"), vector("Осьминог Okto", 108, 108, octoVector(0.68, 54)));
fs.writeFileSync(res("drawable/ic_launcher_background.xml"), vector("Фон значка Okto: тёмное стекло с бликом сверху", 108, 108, `    <path android:pathData="M0,0h108v108h-108z">
${grad("fillColor", 0, 108, TILE)}    </path>
    <path
        android:fillColor="#24FFFFFF"
        android:pathData="M0,0h108v39.5Q54,54 0,39.5z" />
`));
// Заставка TWA: скруглённый квадрат, как favicon
fs.writeFileSync(res("drawable/splash.xml"), vector("Заставка: осьминог Okto", 96, 64, `    <path android:pathData="M16,0h32a16,16 0,0 1,16 16v32a16,16 0,0 1,-16 16h-32a16,16 0,0 1,-16 -16v-32a16,16 0,0 1,16 -16z">
${grad("fillColor", 0, 64, TILE)}    </path>
` + octoVector(0.5, 32)));

console.log("ok");
