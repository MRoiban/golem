// Switch motion frames: docs/screenshots/switch/frames-*.png (SHOTS=1 bunx playwright test e2e/switch-frames.spec.ts --project chromium).
// Themes, fallback and phone come from e2e/gallery.spec.ts.
import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, settled } from "./helpers";

const out = (name: string) => `docs/screenshots/switch/${name}.png`;
test.skip(!process.env.SHOTS, "set SHOTS=1 to write docs/screenshots");

test.describe("stretch", () => {
  test.use({ deviceScaleFactor: 6 });
  test("switch frames", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto("/?c=switch&motion=anima&many=0");
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
      await wrap.screenshot({ path: out(`frames-stretch-${String(Math.round(at * 1000)).padStart(3, "0")}ms`) });
    }
  });
});
