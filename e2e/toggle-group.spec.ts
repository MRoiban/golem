import { expect, test } from "@playwright/test";
import {
  THEMES,
  THEME_LABELS,
  settled,
  watchConsole,
  expectDecorativeOnly,
  expectNoHorizontalOverflow,
  resolvedColor,
} from "./helpers";
import { go, expectAligned, iconFill } from "./indicators";
for (const mode of ["anima", "css", "reduced", "off"])
  test(`console and interactions ${mode}`, async ({ page }) => {
    const c = watchConsole(page);
    await go(
      page,
      "toggle-group",
      mode === "off" ? "anima=off&motion=anima" : `motion=${mode}`,
    );
    await settled(page, mode === "anima");
    await page
      .getByTestId("toggle-basic")
      .getByRole("radio", { name: "Month", exact: true })
      .click();
    await page
      .getByTestId("toggle-multiple")
      .getByRole("button", { name: "Italic" })
      .click();
    for (const t of THEME_LABELS)
      await page.getByRole("radio", { name: t, exact: true }).click();
    if (mode !== "anima") {
      await expect(page.locator("anima-icon")).toHaveCount(0);
      await expect(page.locator("[data-anima=ready]")).toHaveCount(0);
    }
    c.expectClean();
  });
for (const motion of ["anima", "css"])
  test(`keyboard, disabled, multiple and form reset ${motion}`, async ({
    page,
  }) => {
    await go(page, "toggle-group", `motion=${motion}`);
    await settled(page, motion === "anima");
    const root = page.getByTestId("toggle-basic"),
      day = root.getByRole("radio", { name: "Day", exact: true }),
      month = root.getByRole("radio", { name: "Month", exact: true });
    await day.focus();
    await page.keyboard.press("End");
    await expect(month).toBeFocused();
    await page.keyboard.press("Space");
    await expect(month).toHaveAttribute("aria-checked", "true");
    expect(
      await month.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
    await page.keyboard.press("ArrowRight");
    await expect(day).toBeFocused();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await expect(day).toHaveAttribute("aria-checked", "true");
    await expect(root.getByRole("radio", { name: "Locked" })).toBeDisabled();
    const multiple = page.getByTestId("toggle-multiple");
    await multiple.getByRole("button", { name: "Italic" }).click();
    await expect(
      multiple.getByRole("button", { name: "Bold" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      multiple.getByRole("button", { name: "Italic" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(multiple.locator("anima-icon")).toHaveCount(0);
    const form = page.getByTestId("toggle-form");
    await form.getByRole("radio", { name: "Month" }).click();
    await expect(form.locator("input")).toHaveValue("month");
    await form.getByRole("button", { name: "Reset view" }).click();
    await expect(form.locator("input")).toHaveValue("day");
    await expectDecorativeOnly(page);
  });
test("drawing at rest and follows pointer, clear, keyboard, controlled and vertical", async ({
  page,
}) => {
  await go(page, "toggle-group");
  await settled(page, true);
  const part = page.getByTestId("toggle-basic"),
    day = part.getByRole("radio", { name: "Day", exact: true }),
    month = part.getByRole("radio", { name: "Month", exact: true });
  await expectAligned(part, day);
  await month.click();
  await expectAligned(part, month);
  await month.click();
  await expect(month).toHaveAttribute("aria-checked", "false");
  await expect
    .poll(() =>
      part.evaluate(
        (el) =>
          (el.querySelector("anima-icon") as any).values()["canvas.opacity"],
      ),
    )
    .toBe(0);
  await day.focus();
  await page.keyboard.press("Space");
  await expectAligned(part, day);
  await page.getByTestId("toggle-external").click();
  const controlled = page.getByTestId("toggle-controlled");
  await expectAligned(
    controlled,
    controlled.getByRole("radio", { name: "Month", exact: true }),
  );
  const vertical = page.getByTestId("toggle-vertical");
  await vertical.getByRole("radio", { name: "Day", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expectAligned(
    vertical,
    vertical.getByRole("radio", { name: "Week view" }),
  );
});
for (const theme of THEMES)
  test(`theme ${theme}`, async ({ page }) => {
    await go(page, "toggle-group", `motion=anima&theme=${theme}`);
    await settled(page, true);
    const fill = await iconFill(page.getByTestId("toggle-basic"), "selected");
    expect(fill).toBe(await resolvedColor(page, "var(--onyx-state-selected)"));
    expect(fill).toBe(
      await page
        .getByTestId("toggle-plain")
        .getByRole("radio", { name: "Day", exact: true })
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    );
  });
test("OS reduced motion uses Onyx", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "toggle-group", "motion=system");
  await settled(page, false);
  await expect(page.locator("anima-icon")).toHaveCount(0);
  const day = page
    .getByTestId("toggle-basic")
    .getByRole("radio", { name: "Day", exact: true });
  expect(await day.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    await resolvedColor(page, "var(--onyx-state-selected)"),
  );
});
for (const motion of ["anima", "css"])
  test(`phone ${motion}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await go(page, "toggle-group", `motion=${motion}`);
    await settled(page, motion === "anima");
    await expectNoHorizontalOverflow(page);
  });
