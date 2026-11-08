import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, pauseParts, settled } from "./helpers";

test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 6 });
test("checkbox draw, morph and reverse frames", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=checkbox&motion=anima&theme=light"); await settled(page, true);
  const selector = ".golem-checkbox:has([data-testid='check-controlled'])";
  const step = await pauseParts(page, selector);
  const wrap = page.locator(selector);
  for (const [action, label] of [["off", "Set unchecked"], ["check", "Set checked"], ["dash", "Set mixed"], ["reverse", "Set unchecked"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(30); await step(0);
    let time = 0;
    for (const at of [0, 0.04, 0.08, 0.16, 0.24]) {
      await step(at - time); time = at;
      await wrap.screenshot({ path: `docs/screenshots/checkbox/frames-${action}-${Math.round(at * 1000)}ms.png` });
    }
  }
});
