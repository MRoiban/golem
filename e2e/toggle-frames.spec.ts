import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, pauseParts, settled } from "./helpers";

test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 6 });
test("toggle centred background and press frames", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=toggle&motion=anima&theme=light"); await settled(page, true);
  for (const id of ["toggle-icon", "toggle-text"]) {
    const selector = `.golem-toggle:has([data-testid='${id}'])`;
    const step = await pauseParts(page, selector);
    const target = page.getByTestId(id);
    await target.click(); await page.waitForTimeout(30); await step(0);
    let time = 0;
    for (const at of [0, 0.04, 0.08, 0.16, 0.24]) {
      await step(at - time); time = at;
      await page.locator(selector).screenshot({ path: `docs/screenshots/toggle/frames-${id}-${Math.round(at * 1000)}ms.png` });
    }
    // Capture the press on a selected background for both the icon and text variants.
    if (await target.getAttribute("aria-pressed") !== "true") {
      await target.click(); await page.waitForTimeout(30); await step(0); await step(1);
    }
    await target.hover(); await page.mouse.down(); await page.waitForTimeout(30); await step(0.1);
    await page.locator(selector).screenshot({ path: `docs/screenshots/toggle/frames-${id}-press.png` });
    await page.mouse.up();
  }
});
