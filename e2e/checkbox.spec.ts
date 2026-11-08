import { expect, test } from "@playwright/test";
import { choiceContract, values } from "./choice-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, expectDecorativeOnly, settled } from "./helpers";

choiceContract("checkbox", { buttonBg: "control-button-bg", buttonFg: "control-button-fg", inputBg: "control-input-bg", inputBorder: "control-input-border" }, "check-on");

for (const motion of ["anima", "css"]) test(`checkbox semantics, keyboard, forms: ${motion}`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=checkbox&motion=${motion}`); await settled(page, motion === "anima");
  const box = page.getByRole("checkbox", { name: "Notifications" });
  await expect(box).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Some folders" })).toBeChecked({ indeterminate: true });
  await expect(page.getByRole("checkbox", { name: "Managed option" })).toBeDisabled();
  await box.focus(); await page.keyboard.press("Space"); await expect(box).toBeChecked();
  await page.keyboard.press("Tab"); await expect(page.getByTestId("check-on")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByTestId("check-mixed")).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByTestId("check-controlled")).toBeFocused();
  expect(await page.getByTestId("check-controlled").evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
  const reset = page.getByTestId("check-reset");
  await reset.click(); await expect(reset).not.toBeChecked();
  await page.getByRole("button", { name: "Reset checkbox" }).click(); await expect(reset).toBeChecked();
  expect(await page.getByTestId("check-form").evaluate((el) => new FormData(el as HTMLFormElement).get("updates"))).toBe("yes");
  await reset.click(); await expect(reset).not.toBeChecked(); // next click after native reset still works
  await expectDecorativeOnly(page);
});

test("checkbox drawing: rest, pointer, keyboard, controlled check/dash and geometry", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=checkbox&motion=anima"); await settled(page, true);
  expect((await values(page, "check-on"))["active.opacity"]).toBe(1);
  expect((await values(page, "check-on"))["box.scale"]).toBe(1);
  expect((await values(page, "check-off"))["active.opacity"]).toBe(0);
  expect((await values(page, "check-mixed"))["short.rotate"]).toBe(0);
  const off = page.getByTestId("check-off");
  await off.click(); await expect.poll(async () => (await values(page, "check-off"))["long.stroke.trimEnd"]).toBe(1);
  await page.keyboard.press("Space"); await expect.poll(async () => (await values(page, "check-off"))["active.opacity"]).toBe(0);
  await page.getByRole("button", { name: "Set mixed", exact: true }).click();
  await expect.poll(async () => (await values(page, "check-controlled"))["long.rotate"]).toBe(0);
  await page.getByRole("button", { name: "Set checked", exact: true }).click();
  await expect.poll(async () => (await values(page, "check-controlled"))["long.rotate"]).toBe(-45);
  await page.getByRole("button", { name: "Set unchecked", exact: true }).click();
  await expect.poll(async () => (await values(page, "check-controlled"))["mark.opacity"]).toBe(0);
  for (const wrap of await page.locator(".golem-checkbox").all()) {
    const boxes = await wrap.evaluate((w) => [w, w.querySelector("input")!, w.querySelector(".golem-anima")!].map((el) => { const b = el.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; }));
    expect(boxes[0]).toEqual(boxes[1]); expect(boxes[0]).toEqual(boxes[2]);
  }
  expect(await off.evaluate((el) => getComputedStyle(el, "::after").opacity)).toBe("0");
});
