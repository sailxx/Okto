// PNG-копии больших картинок README для Komi Store: любую ссылку на .svg он считает значком
// и сжимает до 220×40 dp, а PNG показывает во всю ширину. GitHub берёт SVG из <picture><source>.
// Рендерит headless Chrome: SVG встраивается в страницу (в <img> анимации не доматываются), шрифты в нём свои.
// Путь к браузеру можно задать переменной CHROME. Запускается из build.mjs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const src = "assets/readme/";
const out = "assets/readme/png/";
const SCALE = 1.5;
export const PNG_IMAGES = ["hero", "android", "sections", "quality", "design", "more", "safe"];

const chrome = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && fs.existsSync(p));

export function renderPngs() {
  if (!chrome) {
    console.warn("PNG для Komi Store не обновлены: не найден Chrome (задайте переменную CHROME)");
    return;
  }
  fs.mkdirSync(out, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "okto-readme-"));
  const names = fs.readdirSync(src).filter((f) => new RegExp(`^(${PNG_IMAGES.join("|")})-[a-z]+\\.svg$`).test(f));
  for (const name of names) {
    const svg = fs.readFileSync(src + name, "utf8");
    const [, w, h] = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/).map(Number);
    const page = path.join(tmp, "page.html");
    fs.writeFileSync(
      page,
      `<!doctype html><style>html,body{margin:0;background:transparent}</style>` +
        `<div style="width:${w}px;height:${h}px">${svg.replace(/^<\?xml[^>]*>/, "")}</div>`,
    );
    execFileSync(chrome, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--user-data-dir=${path.join(tmp, "profile")}`,
      `--force-device-scale-factor=${SCALE}`,
      "--default-background-color=00000000",
      "--virtual-time-budget=4000",
      `--window-size=${Math.ceil(w)},${Math.ceil(h)}`,
      `--screenshot=${path.resolve(out + name.replace(/\.svg$/, ".png"))}`,
      pathToFileURL(page).href,
    ], { stdio: "ignore" });
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`PNG для Komi Store: ${names.length} файлов в ${out}`);
}
