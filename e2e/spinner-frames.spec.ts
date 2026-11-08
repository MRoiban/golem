import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
import { resetActionParts } from "./actions-frames";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write frames");
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
    await page.getByTestId("section-spinner").screenshot({ path: `docs/screenshots/spinner/frames-${String(ms).padStart(3, "0")}ms.png` });
  }
});
