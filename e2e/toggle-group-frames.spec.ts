import { expect, test } from "@playwright/test";
import { settled, pauseParts } from "./helpers";
import { go, drawingBox } from "./indicators";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 3 });
test("single-selection pill mid-travel", async ({ page }) => {
  await go(page, "toggle-group");
  await settled(page, true);
  const selector = '[data-testid="toggle-basic"]',
    part = page.locator(selector);
  const step = await pauseParts(page, selector);
  await part.getByRole("radio", { name: "Month", exact: true }).click();
  const boxes = [];
  let last = 0;
  for (const at of [0, 0.04, 0.08, 0.2]) {
    await step(at - last);
    last = at;
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    boxes.push(await drawingBox(part));
    await part.screenshot({
      path: `docs/screenshots/toggle-group/frames-${at * 1000}ms.png`,
    });
  }
  expect(Math.abs(boxes[1]!.x - boxes[3]!.x)).toBeGreaterThan(1);
  expect(boxes[1]!.width).toBeGreaterThan(boxes[3]!.width);
});
