import { expect, test } from "@playwright/test";
import { choiceContract, values } from "./choice-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, expectDecorativeOnly, settled } from "./helpers";

choiceContract("toggle", { selected: "state-selected" }, "toggle-disabled");
for (const motion of ["anima", "css"]) test(`toggle semantics, keyboard, forms: ${motion}`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=toggle&motion=${motion}`); await settled(page, motion === "anima");
  const bold = page.getByRole("button", { name: "Bold", exact: true });
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("toggle-disabled")).toBeDisabled();
  await bold.focus(); await page.keyboard.press("Space"); await expect(bold).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter"); await expect(bold).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Tab"); await expect(page.getByTestId("toggle-text")).toBeFocused();
  expect(await page.getByTestId("toggle-text").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  const reset = page.getByTestId("toggle-reset");
  await reset.click(); await expect(reset).toHaveAttribute("aria-pressed", "false");
  expect(await page.getByTestId("toggle-form").evaluate((el) => new FormData(el as HTMLFormElement).has("preview"))).toBe(false);
  await page.getByRole("button", { name: "Reset toggle" }).click(); await expect(reset).toHaveAttribute("aria-pressed", "true");
  expect(await page.getByTestId("toggle-form").evaluate((el) => new FormData(el as HTMLFormElement).get("preview"))).toBe("on");
  await expectDecorativeOnly(page);
});

test("toggle drawing follows state and stays below untouched content", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=toggle&motion=anima"); await settled(page, true);
  expect((await values(page, "toggle-text"))["background.scale"]).toBe(1);
  expect((await values(page, "toggle-icon"))["background.scale"]).toBe(0);
  const icon = page.getByTestId("toggle-icon");
  await expect(icon.locator(":scope > svg")).toHaveCount(1);
  await icon.click(); await expect.poll(async () => (await values(page, "toggle-icon"))["background.scale"]).toBe(1);
  await page.keyboard.press("Space"); await expect.poll(async () => (await values(page, "toggle-icon"))["background.scale"]).toBe(0);
  await page.getByRole("button", { name: "Change pressed" }).click();
  await expect.poll(async () => (await values(page, "toggle-controlled"))["background.scale"]).toBe(0);
  for (const id of ["toggle-icon", "toggle-text", "toggle-controlled"]) {
    const g = await page.getByTestId(id).evaluate((el) => {
      const motion = el.closest(".golem-part")!.querySelector(".golem-anima")!;
      const a = el.getBoundingClientRect(), b = motion.getBoundingClientRect();
      return { a: [a.x, a.y, a.width, a.height], b: [b.x, b.y, b.width, b.height], z: getComputedStyle(el).zIndex, mz: getComputedStyle(motion).zIndex, transform: getComputedStyle(el).transform };
    });
    expect(g.a).toEqual(g.b); expect(Number(g.z)).toBeGreaterThan(Number(g.mz)); expect(g.transform).toBe("none");
  }
});
