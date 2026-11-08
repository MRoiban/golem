import { test, expect } from "@playwright/test";
import { disclosureBasics, value, visibleFocus } from "./disclosure-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, settled, expectDecorativeOnly } from "./helpers";
disclosureBasics("accordion");
for (const motion of ["anima", "css"]) test(`Onyx single/multiple keyboard, disabled and pointer (${motion})`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=accordion&motion=${motion}`); await settled(page, motion === "anima");
  const general = page.getByRole("button", { name: "General", exact: true }), advanced = page.getByTestId("advanced");
  await visibleFocus(general, page); await page.keyboard.press("ArrowDown"); await expect(advanced).toBeFocused();
  await page.keyboard.press("Home"); await expect(general).toBeFocused(); await page.keyboard.press("End"); await expect(advanced).toBeFocused();
  await page.keyboard.press("Enter"); await expect(advanced).toHaveAttribute("aria-expanded", "true"); await expect(general).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Space"); await expect(advanced).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("locked")).toBeDisabled();
  await page.getByTestId("history").locator("[data-slot='accordion-chevron']").click();
  await expect(page.getByTestId("history")).toHaveAttribute("aria-expanded", "true"); await expect(page.getByTestId("files")).toHaveAttribute("aria-expanded", "true");
  await expectDecorativeOnly(page);
});
test("drawing follows pointer, keyboard and external controlled values; initially open rests", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=accordion&motion=anima"); await settled(page, true);
  expect(await value(page.getByTestId("general"), "chevron.rotate")).toBe(0);
  expect(await value(page.getByTestId("history"), "chevron.rotate")).toBe(-90);
  await page.getByTestId("history").click(); await expect.poll(() => value(page.getByTestId("history"), "chevron.rotate")).toBe(0);
  await page.getByTestId("history").focus(); await page.keyboard.press("Enter"); await expect.poll(() => value(page.getByTestId("history"), "chevron.rotate")).toBe(-90);
  await page.getByRole("button", { name: "Change controlled item" }).click();
  await expect.poll(() => value(page.getByTestId("general"), "chevron.rotate")).toBe(-90);
  await expect.poll(() => value(page.getByTestId("advanced"), "chevron.rotate")).toBe(0);
});
