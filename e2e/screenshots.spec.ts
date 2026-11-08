// Screenshots for docs/screenshots/ (SHOTS=1 bunx playwright test e2e/screenshots.spec.ts --project chromium).
import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, settled } from "./helpers";

const out = (name: string) => `docs/screenshots/${name}.png`;
test.skip(!process.env.SHOTS, "set SHOTS=1 to write docs/screenshots");

test.describe("desktop", () => {
  test.use({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
  for (const theme of ["dark", "light", "rose", "rose-dark", "flexoki", "flexoki-dark"]) {
    test(`theme ${theme}`, async ({ page }) => {
      test.skip(!HAS_ANIMA, NEEDS_ANIMA);
      await page.goto(`/?motion=anima&theme=${theme}&many=12`);
      await settled(page, true);
      await page.screenshot({ path: out(`theme-${theme}`), fullPage: true });
    });
  }
  test("fallback (no Anima)", async ({ page }) => {
    await page.goto("/?motion=anima&anima=off&many=12");
    await settled(page, false);
    await page.screenshot({ path: out("fallback-no-anima"), fullPage: true });
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
  test("phone, light", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto("/?motion=anima&theme=light&many=12");
    await settled(page, true);
    await page.screenshot({ path: out("phone-light"), fullPage: true });
  });
});

test.describe("stretch", () => {
  test.use({ deviceScaleFactor: 6 });
  test("switch frames", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto("/?motion=anima&many=0");
    await settled(page, true);
    const sw = page.getByTestId("beta");
    const wrap = sw.locator("xpath=..");
    // Deterministic frames: pause the host, toggle, then step the player by hand.
    await sw.evaluate((b) => (b.parentElement!.querySelector("anima-icon") as HTMLElement & { pause(): void }).pause());
    await sw.click();
    let t = 0;
    for (const at of [0, 0.04, 0.08, 0.12, 0.16, 0.24]) {
      await sw.evaluate((b, dt) => {
        const icon = b.parentElement!.querySelector("anima-icon") as HTMLElement & { player: { step(d: number): void }; invalidate(): void };
        icon.player.step(dt);
        icon.invalidate();
      }, at - t);
      t = at;
      await wrap.screenshot({ path: out(`stretch-${String(Math.round(at * 1000)).padStart(3, "0")}ms`) });
    }
  });
});
