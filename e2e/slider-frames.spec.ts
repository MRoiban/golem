import { expect, test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, pauseParts, settled } from "./helpers";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 8 });
// Frames are cropped around the thumb (plus a strip of track) so the squash is visible.
const around = async (page: import("@playwright/test").Page, thumb: import("@playwright/test").Locator, path: string) => {
  await thumb.scrollIntoViewIfNeeded();
  const b = (await thumb.boundingBox())!;
  await page.screenshot({ path, clip: { x: b.x - 14, y: b.y - 8, width: b.width + 28, height: b.height + 16 } });
};
test("thumb squash during a captured drag", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=slider&motion=anima");
  await settled(page, true);
  const root = page.getByTestId("single");
  const step = await pauseParts(page, "[data-testid='single']");
  const box = (await root.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height / 2);
  await page.mouse.down();
  // At rest, before the squash: the drawn thumb next to the frames below.
  await page.waitForTimeout(50); // React writes down while the player is paused.
  await step(0);
  const held = await root.locator("anima-icon").evaluate((e) => (e as HTMLElement & { get(k: string): boolean }).get("down"));
  expect(held).toBe(true);
  let t = 0;
  for (const at of [0, 0.04, 0.08, 0.1]) {
    await step(at - t); t = at;
    await around(page, root.getByRole("slider"), `docs/screenshots/slider/frames-drag-${Math.round(at * 1000)}ms.png`);
  }
  const geometry = await root.getByRole("slider").evaluate((e) => {
    const a = e.getBoundingClientRect(), b = e.querySelector("anima-icon")!.getBoundingClientRect();
    return Math.abs(a.x + a.width / 2 - b.x - b.width / 2);
  });
  expect(geometry).toBeLessThan(0.1);
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height / 2);
  await around(page, root.getByRole("slider"), "docs/screenshots/slider/frames-drag-moved.png");
  await page.mouse.up(); await page.waitForTimeout(50);
  await step(0); await step(0.16);
  await around(page, root.getByRole("slider"), "docs/screenshots/slider/frames-drag-released.png");
  await around(page, page.getByTestId("plain").getByRole("slider"), "docs/screenshots/slider/frames-plain.png");
});
