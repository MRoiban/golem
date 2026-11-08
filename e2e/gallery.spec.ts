// The screenshot gallery: every demo section, in every theme, at rest, plus the no-Anima fallback
// and phone width. SHOTS=1 bunx playwright test e2e/gallery.spec.ts --project chromium
// Writes docs/screenshots/<section>/<theme>.png, fallback.png, phone.png. ?c=<id> limits it: GALLERY=checkbox,tabs
import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, settled } from "./helpers";

test.skip(!process.env.SHOTS, "set SHOTS=1 to write docs/screenshots");
const only = process.env.GALLERY ? `&c=${process.env.GALLERY}` : "";

async function shootSections(page: import("@playwright/test").Page, name: string) {
  for (const s of await page.locator("[data-testid^='section-']").all()) {
    const id = (await s.getAttribute("data-testid"))!.slice("section-".length);
    await s.screenshot({ path: `docs/screenshots/${id}/${name}.png`, animations: "disabled" });
  }
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
  for (const theme of THEMES) {
    test(`theme ${theme}`, async ({ page }) => {
      test.skip(!HAS_ANIMA, NEEDS_ANIMA);
      await page.goto(`/?motion=anima&theme=${theme}&many=0${only}`);
      await settled(page, true);
      await page.waitForTimeout(400);
      await shootSections(page, theme);
    });
  }
  test("fallback (no Anima)", async ({ page }) => {
    await page.goto(`/?motion=anima&anima=off&many=0${only}`);
    await settled(page, false);
    await shootSections(page, "fallback");
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
  test("phone, light", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?motion=anima&theme=light&many=0${only}`);
    await settled(page, true);
    await page.waitForTimeout(400);
    await shootSections(page, "phone");
  });
});
