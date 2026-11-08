import { expect, test } from "@playwright/test";
import { settled, pauseParts } from "./helpers";
import { go, drawingBox } from "./indicators";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 3 });
test("tabs indicator mid-travel in both directions", async ({ page }) => {
  await go(page, "tabs");
  await settled(page, true);
  const selector = '[data-testid="tabs-basic"] [data-golem-part="tabs"]',
    part = page.locator(selector);
  const step = await pauseParts(page, selector);
  for (const [name, label] of [
    ["forward", "Files"],
    ["back", "Notes"],
  ]) {
    await page
      .getByTestId("tabs-basic")
      .getByRole("tab", { name: label, exact: true })
      .click();
    const boxes = [];
    let last = 0;
    for (const at of [0, 0.04, 0.08, 0.2]) {
      await step(at - last);
      last = at;
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      );
      boxes.push(await drawingBox(part));
      await page.getByTestId("tabs-basic").screenshot({
        path: `docs/screenshots/tabs/frames-${name}-${at * 1000}ms.png`,
      });
    }
    expect(Math.abs(boxes[1]!.x - boxes[3]!.x)).toBeGreaterThan(1);
    expect(boxes[1]!.width).toBeGreaterThan(boxes[3]!.width);
  }
});
