import { test, expect } from "@playwright/test";
import { disclosureBasics, value, partFor, visibleFocus } from "./disclosure-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, settled, expectDecorativeOnly, pauseParts } from "./helpers";
disclosureBasics("alert");
for (const motion of ["anima", "css"]) test(`Onyx urgency, keyboard actions and dismissal (${motion})`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=alert&motion=${motion}`); await settled(page, motion === "anima");
  for (const tone of ["neutral", "info", "success"]) await expect(page.getByTestId(tone)).toHaveAttribute("role", "status");
  for (const tone of ["warning", "danger"]) await expect(page.getByTestId(tone)).toHaveAttribute("role", "alert");
  await expect(page.getByRole("button", { name: "Unavailable action" })).toBeDisabled();
  await expect(page.getByTestId("custom").locator("anima-icon")).toHaveCount(0);
  const close = page.getByRole("button", { name: "Dismiss alert", exact: true });
  await visibleFocus(close, page); await page.keyboard.press("Enter"); await expect(page.getByTestId("dismissible")).toHaveCount(0);
  await expectDecorativeOnly(page);
});
test("mount draw settles and never replays on rerender; DOM tone switches without remount", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=alert&motion=anima"); await settled(page, true);
  const part = partFor(page, "controlled");
  const geometry = await part.evaluate(el => {
    const a = el.getBoundingClientRect(), b = el.querySelector(".codicon")!.getBoundingClientRect();
    return [a.x-b.x, a.y-b.y, a.width-b.width, a.height-b.height];
  });
  for (const n of geometry) expect(n).toBeCloseTo(0, 1);
  await expect.poll(() => value(part, "info-ring.stroke.trimEnd")).toBe(1);
  const handle = await part.locator("anima-icon").elementHandle();
  await pauseParts(page, "[data-testid='controlled'] [data-golem-part]");
  await page.getByRole("button", { name: "Re-render alert" }).click();
  await part.locator("anima-icon").evaluate(el => { const icon = el as any; icon.player.step(0); icon.invalidate(); });
  // Pause makes a replay observable: the trim must stay complete after another parent render.
  await expect.poll(() => value(part, "info-ring.stroke.trimEnd")).toBe(1);
  await page.getByRole("button", { name: "Change tone" }).click();
  await part.locator("anima-icon").evaluate(el => { const icon = el as any; icon.player.step(0); icon.invalidate(); });
  expect(await value(part, "success.opacity")).toBe(1);
  expect(await value(part, "info.opacity")).toBe(0);
  expect(await handle!.evaluate(el => el.isConnected)).toBe(true);
  await page.getByTestId("info").locator("[data-slot='alert-icon']").click();
  await expect(page.getByTestId("info")).toHaveAttribute("data-state", "open");
});
