import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, pauseParts, settled } from "./helpers";

test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 3 });
test("radio old dot shrinks while new dot grows", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=radio-group&motion=anima&theme=light"); await settled(page, true);
  const step = await pauseParts(page, ".golem-radio-group-item");
  await page.getByTestId("radio-fast").click(); await page.waitForTimeout(30); await step(0);
  let time = 0;
  for (const at of [0, 0.04, 0.08, 0.1, 0.16, 0.24]) {
    await step(at - time); time = at;
    await page.getByTestId("radio-quality").screenshot({ path: `docs/screenshots/radio-group/frames-select-${Math.round(at * 1000)}ms.png` });
  }
});
