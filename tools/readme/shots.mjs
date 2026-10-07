// Скриншоты экранов Okto для README через Chrome DevTools Protocol (мобильная эмуляция 390×844 @2x).
// Нужен собранный Okto (npm run build), tools/readme/seed.html в dist/ и `vite preview` на :4173.
// Запуск: node tools/readme/shots.mjs   → tools/readme/.font/shots/<lang>-<screen>.png
import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "tools/readme/.font/shots/";
const BASE = "http://localhost:4173/seed.html";
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", "--user-data-dir=" + process.cwd() + "/tools/readme/.font/chrome", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list;
for (let i = 0; i < 40 && !list; i++) { await sleep(250); list = await fetch("http://127.0.0.1:9333/json").then((r) => r.json()).catch(() => null); }
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

await send("Page.enable");
// Полдень на экранах: календарь прокручен к рабочему дню, приветствие дневное.
// Пояс подбираем от текущего времени (Etc/GMT-N = UTC+N), чтобы в момент съёмки было ~12:00.
const noonOffset = ((12 - new Date().getUTCHours() + 36) % 24) - 12;
const noonZone = noonOffset === 0 ? "Etc/GMT" : `Etc/GMT${noonOffset > 0 ? "-" : "+"}${Math.abs(noonOffset)}`;
await send("Emulation.setTimezoneOverride", { timezoneId: noonZone });
const shots = [
  ["home", "", "day"], ["tasks", "tasks", "day"], ["calendar", "calendar", "day"], ["focus", "focus", "day"],
];
for (const lang of ["ru", "en"]) {
  for (const [name, to, view] of shots) {
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });
    await send("Page.navigate", { url: `${BASE}?lang=${lang}&to=${to}&view=${view}` });
    await sleep(3500);
    const r = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(`${OUT}${lang}-${name}.png`, Buffer.from(r.result.data, "base64"));
    console.log(`${lang}-${name}.png`);
  }
}
const NAMES = { ru: ["Главная", "Задачи", "Календарь", "Фокус"], en: ["Home", "Tasks", "Calendar", "Focus"] };
for (const lang of ["ru", "en"]) {
  const img = (n) => "data:image/png;base64," + fs.readFileSync(`${OUT}${lang}-${n}.png`).toString("base64");
  const font = fs.readFileSync("tools/readme/.font/JetBrainsMono-Var.woff2").toString("base64");
  const phones = shots.map(([n], i) => `<figure><div class="ph"><img src="${img(n)}"></div><figcaption>${NAMES[lang][i]}</figcaption></figure>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:JBM;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 800}
html,body{margin:0;background:transparent}
.card{width:880px;box-sizing:border-box;padding:36px 34px 26px;border-radius:22px;background:#f6f6f4 radial-gradient(#14141410 1px,transparent 1.2px) 0 0/22px 22px;border:1px solid #1414141f;display:flex;gap:18px;justify-content:center}
figure{margin:0;flex:1;display:flex;flex-direction:column;align-items:center}
.ph{width:100%;aspect-ratio:390/844;border-radius:30px;padding:7px;background:#141414;box-shadow:0 1px 2px #0000001a,0 14px 30px #0000001f}
.ph img{width:100%;height:100%;border-radius:23px;display:block;object-fit:cover}
figcaption{margin-top:14px;font:600 11px JBM;letter-spacing:2.4px;text-transform:uppercase;color:#141414}
figure:nth-child(4) figcaption{color:#d33a3f}
</style><div class="card">${phones}</div>`;
  await send("Emulation.setDeviceMetricsOverride", { width: 880, height: 600, deviceScaleFactor: 2, mobile: false });
  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  await send("Page.navigate", { url: "about:blank" });
  await sleep(300);
  const { result: { frameTree } } = await send("Page.getFrameTree");
  await send("Page.setDocumentContent", { frameId: frameTree.frame.id, html });
  await sleep(1200);
  const { result: { result: m } } = await send("Runtime.evaluate", { expression: "JSON.stringify(document.querySelector('.card').getBoundingClientRect())" });
  const r = JSON.parse(m.value);
  const shot = await send("Page.captureScreenshot", { format: "webp", quality: 92, clip: { x: 0, y: 0, width: 880, height: Math.ceil(r.height), scale: 1 } });
  fs.writeFileSync(`assets/readme/screens-${lang}.webp`, Buffer.from(shot.result.data, "base64"));
  console.log(`assets/readme/screens-${lang}.webp`);
}
ws.close();
chrome.kill();
