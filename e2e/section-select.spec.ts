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
const partSelector = '[data-slot="section-select-content"]';
for (const mode of ["anima", "css", "reduced", "off"])
  test(`console and interactions ${mode}`, async ({ page }) => {
    const c = watchConsole(page);
    await go(
      page,
      "section-select",
      mode === "off" ? "anima=off&motion=anima" : `motion=${mode}`,
    );
    await page
      .getByRole("combobox", { name: "Project section", exact: true })
      .click();
    await settled(page, mode === "anima");
    await page.getByRole("option", { name: "Activity log" }).click();
    await expect(page.getByTestId("select-value")).toHaveText("activity");
    if (mode !== "anima") {
      await expect(page.locator("anima-icon")).toHaveCount(0);
      await expect(page.locator("[data-anima=ready]")).toHaveCount(0);
    }
    for (const t of THEME_LABELS)
      await page.getByRole("radio", { name: t, exact: true }).click();
    c.expectClean();
  });
for (const motion of ["anima", "css"])
  test(`keyboard and semantics ${motion}`, async ({ page }) => {
    await go(page, "section-select", `motion=${motion}`);
    const trigger = page.getByRole("combobox", {
      name: "Project section",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await settled(page, motion === "anima");
    await expect(
      page.getByRole("option", { name: "Notes", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("End");
    const files = page.getByRole("option", { name: "Project files" });
    await expect(files).toBeFocused();
    await expect(files).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("select-value")).toHaveText("activity");
    await trigger.click();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("select-value")).toHaveText("notes");
    await trigger.click();
    await expectDecorativeOnly(page);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });
test("drawing mounts at rest and follows active focus without committing selection", async ({
  page,
}) => {
  await go(page, "section-select");
  await page
    .getByRole("combobox", { name: "Project section", exact: true })
    .click();
  await settled(page, true);
  const part = page.locator(partSelector);
  await expectAligned(
    part,
    page.getByRole("option", { name: "Notes", exact: true }),
  );
  await page.keyboard.press("ArrowDown");
  await expectAligned(part, page.getByRole("option", { name: "Activity log" }));
  await expect(
    page.getByRole("option", { name: "Notes", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("option", { name: "Activity log" }).click();
  await expect(page.getByTestId("select-value")).toHaveText("activity");
  await page.getByTestId("select-external").click();
  await page
    .getByRole("combobox", { name: "Project section", exact: true })
    .click();
  await settled(page, true);
  await expectAligned(
    part,
    page.getByRole("option", { name: "Project files" }),
  );
});
for (const theme of THEMES)
  test(`theme ${theme}`, async ({ page }) => {
    await go(page, "section-select", `motion=anima&theme=${theme}`);
    await page
      .getByRole("combobox", { name: "Project section", exact: true })
      .click();
    await settled(page, true);
    expect(await iconFill(page.locator(partSelector), "selected")).toBe(
      await resolvedColor(page, "var(--onyx-state-selected)"),
    );
  });
test("OS reduced motion uses Onyx", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "section-select", "motion=system");
  await settled(page, false);
  await page
    .getByRole("combobox", { name: "Project section", exact: true })
    .click();
  await expect(page.locator("anima-icon")).toHaveCount(0);
  expect(
    await page
      .getByRole("option", { name: "Notes", exact: true })
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(await resolvedColor(page, "var(--onyx-state-selected)"));
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("select-value")).toHaveText("files");
});
for (const motion of ["anima", "css"])
  test(`phone ${motion}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await go(page, "section-select", `motion=${motion}`);
    await page
      .getByRole("combobox", { name: "Project section", exact: true })
      .click();
    await settled(page, motion === "anima");
    await expectNoHorizontalOverflow(page);
  });
