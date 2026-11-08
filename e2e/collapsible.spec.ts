import { test, expect } from "@playwright/test";
import { disclosureBasics, value, visibleFocus } from "./disclosure-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, settled, expectDecorativeOnly } from "./helpers";
disclosureBasics("collapsible");
for (const motion of ["anima", "css"]) test(`Onyx roles, keyboard, disabled and pointer (${motion})`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=collapsible&motion=${motion}`); await settled(page, motion === "anima");
  const trigger = page.getByRole("button", { name: "Project details", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await visibleFocus(trigger, page); await page.keyboard.press("Space"); await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Enter"); await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.locator("[data-slot='collapsible-chevron']").click(); await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("disabled")).toBeDisabled();
  await expect(page.getByTestId("custom")).not.toHaveAttribute("data-golem-part");
  await page.getByTestId("custom").click(); await expect(page.getByTestId("custom")).toHaveAttribute("aria-expanded", "true");
  await expectDecorativeOnly(page);
});
test("drawing follows DOM for pointer, keyboard and controlled props; mounts at rest", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=collapsible&motion=anima"); await settled(page, true);
  const basic = page.getByTestId("basic"), controlled = page.getByTestId("controlled");
  expect(await value(basic, "chevron.rotate")).toBe(-90);
  expect(await value(controlled, "chevron.rotate")).toBe(0);
  await page.waitForTimeout(250); expect(await value(controlled, "chevron.rotate")).toBe(0);
  await basic.locator("[data-slot='collapsible-chevron']").click(); await expect.poll(() => value(basic, "chevron.rotate")).toBe(0);
  await basic.focus(); await page.keyboard.press("Space"); await expect.poll(() => value(basic, "chevron.rotate")).toBe(-90);
  await page.getByRole("button", { name: "Toggle controlled", exact: true }).click(); await expect.poll(() => value(controlled, "chevron.rotate")).toBe(-90);
  const box = await basic.locator("[data-slot='collapsible-chevron']").evaluate(el => {
    const a = el.getBoundingClientRect(), b = el.querySelector("anima-icon")!.getBoundingClientRect();
    return [a.x-b.x,a.y-b.y,a.width-b.width,a.height-b.height];
  });
  for (const n of box) expect(n).toBeCloseTo(0, 1);
});
