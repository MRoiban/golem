// One contact sheet per component: every gallery shot and motion frame in a single labelled image,
// so a reviewer can check a component at a glance.
//   bun scripts/contact-sheet.ts [id …]     → docs/screenshots/<id>/sheet.png (default: every id)
// Needs the gallery (SHOTS=1 bunx playwright test e2e/gallery.spec.ts) and frames specs run first.
import { chromium } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dir, "..", "docs/screenshots");
const THEMES = ["dark", "light", "rose", "rose-dark", "flexoki", "flexoki-dark"];
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

const img = (path: string) => `data:image/png;base64,${readFileSync(path).toString("base64")}`;
const cell = (path: string, label: string, cls = "") =>
  `<figure class="${cls}"><img src="${img(path)}"><figcaption>${label}</figcaption></figure>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 800 }, deviceScaleFactor: 1 });
for (const id of ids) {
  const d = join(dir, id);
  if (!existsSync(d)) { console.warn(`skip ${id}: no ${d}`); continue; }
  const files = readdirSync(d).filter((f) => f.endsWith(".png") && f !== "sheet.png");
  const themes = THEMES.filter((t) => files.includes(`${t}.png`)).map((t) => cell(join(d, `${t}.png`), t));
  const extra = ["fallback", "phone"].filter((t) => files.includes(`${t}.png`))
    .map((t) => cell(join(d, `${t}.png`), t === "fallback" ? "fallback (no Anima: plain Onyx)" : "phone, 360 px, light", t));
  const frames = files.filter((f) => !THEMES.includes(f.slice(0, -4)) && !["fallback.png", "phone.png"].includes(f)).sort()
    .map((f) => cell(join(d, f), f.slice(0, -4), "frame"));
  const missing = [...THEMES, "fallback", "phone"].filter((t) => !files.includes(`${t}.png`));
  await page.setContent(`<!doctype html><style>
    body { margin: 0; padding: 24px; font: 15px system-ui, sans-serif; background: #e7e5df; color: #100f0f; width: max-content; }
    h1 { margin: 0 0 4px; font-size: 22px; } p { margin: 0 0 16px; color: #575653; }
    .row { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
    figure { margin: 0; } img { display: block; width: 380px; border: 1px solid #b7b5ac; border-radius: 6px; }
    .phone img { width: 190px; } .frame img { width: auto; max-width: 380px; max-height: 260px; image-rendering: pixelated; }
    figcaption { margin-top: 4px; font-size: 13px; color: #403e3c; }
    .warn { color: #af3029; font-weight: 600; }
  </style>
  <h1>${id}</h1>
  <p>${themes.length} themes, ${extra.length} extra views, ${frames.length} motion frames${missing.length ? ` · <span class="warn">missing: ${missing.join(", ")}</span>` : ""}</p>
  <div class="row">${themes.slice(0, 3).join("")}</div>
  <div class="row">${themes.slice(3).join("")}</div>
  <div class="row">${extra.join("")}</div>
  ${frames.length ? `<div class="row" style="flex-wrap: wrap; max-width: 2000px">${frames.join("")}</div>` : ""}`);
  await page.locator("body").screenshot({ path: join(d, "sheet.png") });
  console.log(`docs/screenshots/${id}/sheet.png: ${themes.length} themes, ${extra.length} extra, ${frames.length} frames${missing.length ? `, missing ${missing.join(" ")}` : ""}`);
}
await browser.close();
