import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
import { resetActionParts } from "./actions-frames";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write frames");
// 8x and cropped to the spinners, so the turning arc is visible on the contact sheet.
test.use({ deviceScaleFactor: 8 });
test("spinner deterministic motion frames", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.clock.install();
  await page.goto("/?c=spinner&motion=anima&theme=light"); await settled(page, true);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const step = await pauseParts(page, ".golem-spinner");
  await resetActionParts(page, "spinner");

  await page.clock.runFor(1); await step(0);
  let previous = 0;
  for (const ms of [0, 40, 80, 160, 240]) {
    await page.clock.runFor(ms - previous); await step((ms - previous) / 1000); previous = ms;
    // The lg spinner, the largest, with its plain-Onyx counterpart's row excluded.
    const lg = page.locator(".golem-spinner").filter({ has: page.locator("[data-size='lg']") }).first();
    await lg.screenshot({ path: `docs/screenshots/spinner/frames-${String(ms).padStart(3, "0")}ms.png` });
  }
});
