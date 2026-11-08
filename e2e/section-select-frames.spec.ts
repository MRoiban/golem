import { expect, test } from "@playwright/test";
import { THEMES, settled, pauseParts } from "./helpers";
import { go, drawingBox } from "./indicators";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 3 });
for (const theme of THEMES)
  test(`popup ${theme}`, async ({ page }) => {
    await go(page, "section-select", `motion=anima&theme=${theme}`);
    await page
      .getByRole("combobox", { name: "Project section", exact: true })
      .click();
    await settled(page, true);
    await page.getByRole("listbox").screenshot({
      path: `docs/screenshots/section-select/popup-${theme}.png`,
    });
  });
test("popup pill mid-travel", async ({ page }) => {
  await go(page, "section-select");
  await page
    .getByRole("combobox", { name: "Project section", exact: true })
    .click();
  await settled(page, true);
  const selector = '[data-slot="section-select-content"]',
    part = page.locator(selector);
  const step = await pauseParts(page, selector);
  await page.keyboard.press("End");
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
      path: `docs/screenshots/section-select/frames-${at * 1000}ms.png`,
    });
  }
  expect(Math.abs(boxes[1]!.y - boxes[3]!.y)).toBeGreaterThan(1);
  expect(boxes[1]!.height).toBeGreaterThan(boxes[3]!.height);
});

test("popup fallback", async ({ page }) => {
  await go(page, "section-select", "motion=anima&anima=off");
  await page
    .getByRole("combobox", { name: "Project section", exact: true })
    .click();
  await page
    .getByRole("listbox")
    .screenshot({ path: "docs/screenshots/section-select/popup-fallback.png" });
});
test("popup phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await go(page, "section-select", "motion=anima&theme=light");
  await page
    .getByRole("combobox", { name: "Project section", exact: true })
    .click();
  await settled(page, true);
  await page
    .getByRole("listbox")
    .screenshot({ path: "docs/screenshots/section-select/popup-phone.png" });
});
