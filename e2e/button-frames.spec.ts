import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
import { resetActionParts } from "./actions-frames";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write frames");
test("button deterministic motion frames", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.setViewportSize({ width: 760, height: 900 });
  await page.clock.install();
  await page.goto("/?c=button&motion=anima&theme=light"); await settled(page, true);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const step = await pauseParts(page, ".golem-button");
  await resetActionParts(page, "button");
  await page.getByRole("button", { name: "Show success", exact: true }).click();
  await page.clock.runFor(1); await step(0);
  let previous = 0;
  for (const ms of [0, 40, 80, 160, 240]) {
    await page.clock.runFor(ms - previous); await step((ms - previous) / 1000); previous = ms;
    await page.getByTestId("result").locator("..").screenshot({ path: `docs/screenshots/button/frames-success-${String(ms).padStart(3, "0")}ms.png` });
  }
  await page.getByRole("button", { name: "Show error", exact: true }).click();
  await page.clock.runFor(1); await step(0); previous = 0;
  for (const ms of [0, 40, 80, 160, 240]) {
    await page.clock.runFor(ms - previous); await step((ms - previous) / 1000); previous = ms;
    await page.getByTestId("result").locator("..").screenshot({ path: `docs/screenshots/button/frames-error-${String(ms).padStart(3, "0")}ms.png` });
  }
  const b = page.getByTestId("variant-default"), box = (await b.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.clock.runFor(160);
  await b.locator("..").screenshot({ path: "docs/screenshots/button/frames-pressed.png" });
  await page.mouse.up(); await page.clock.runFor(200);
  await b.locator("..").screenshot({ path: "docs/screenshots/button/frames-released.png" });
});
