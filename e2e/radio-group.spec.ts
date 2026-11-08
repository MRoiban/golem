import { expect, test } from "@playwright/test";
import { arrow, choiceContract, values } from "./choice-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, expectDecorativeOnly, settled } from "./helpers";

choiceContract("radio-group", { buttonFg: "control-button-fg", buttonBg: "control-button-bg" }, "radio-card");
for (const motion of ["anima", "css"]) test(`radio semantics, arrow navigation, forms: ${motion}`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=radio-group&motion=${motion}`); await settled(page, motion === "anima");
  await expect(page.getByRole("radiogroup", { name: "Quality", exact: true })).toBeVisible();
  const fast = page.getByRole("radio", { name: "Fast", exact: true });
  await expect(page.getByTestId("radio-disabled")).toBeDisabled();
  await fast.focus(); await page.keyboard.press("Space"); await expect(fast).toBeChecked();
  await arrow(page, "ArrowDown", "radio-balanced");
  await expect(page.getByTestId("radio-balanced")).toBeChecked();
  await arrow(page, "ArrowUp", "radio-fast");
  await arrow(page, "ArrowUp", "radio-best");
  expect(await page.getByTestId("radio-best").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  expect(await page.getByTestId("radio-form").evaluate((el) => new FormData(el as HTMLFormElement).get("quality"))).toBe("best");
  await page.getByRole("button", { name: "Reset radio" }).click(); await expect(page.getByTestId("radio-balanced")).toBeChecked();
  await expectDecorativeOnly(page);
});

test("radio drawing follows each item: rest, pointer, keyboard, controlled and cards", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=radio-group&motion=anima"); await settled(page, true);
  expect((await values(page, "radio-balanced"))["dot.scale"]).toBe(1);
  expect((await values(page, "radio-fast"))["dot.scale"]).toBe(0);
  // Click exactly on the dot; its decorative overlay cannot intercept the pointer.
  await page.getByTestId("radio-fast").locator("[data-slot='radio-group-control']").click();
  await expect.poll(async () => (await values(page, "radio-fast"))["dot.scale"]).toBe(1);
  await expect.poll(async () => (await values(page, "radio-balanced"))["dot.scale"]).toBe(0);
  await arrow(page, "ArrowDown", "radio-balanced");
  await expect.poll(async () => (await values(page, "radio-balanced"))["dot.scale"]).toBe(1);
  await page.getByRole("button", { name: "Change quality" }).click();
  await expect.poll(async () => (await values(page, "radio-controlled-best"))["dot.scale"]).toBe(1);
  await expect.poll(async () => (await values(page, "radio-controlled-balanced"))["dot.scale"]).toBe(0);
  for (const id of ["radio-balanced", "radio-card"]) {
    const geometry = await page.getByTestId(id).evaluate((el) => {
      const a = el.querySelector("[data-slot='radio-group-control']")!.getBoundingClientRect();
      const b = el.querySelector(".golem-anima")!.getBoundingClientRect();
      return { dx: (a.x + a.width / 2) - (b.x + b.width / 2), dy: (a.y + a.height / 2) - (b.y + b.height / 2) };
    });
    expect(Math.abs(geometry.dx)).toBeLessThan(0.1); expect(Math.abs(geometry.dy)).toBeLessThan(0.1);
    expect(await page.getByTestId(id).locator("[data-slot='radio-group-indicator']").evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");
  }
});
