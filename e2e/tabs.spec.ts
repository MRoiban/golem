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
for (const mode of ["anima", "css", "reduced", "off"]) {
  test(`console and interactions: ${mode}`, async ({ page }) => {
    const c = watchConsole(page);
    await go(
      page,
      "tabs",
      mode === "off" ? "anima=off&motion=anima" : `motion=${mode}`,
    );
    await settled(page, mode === "anima");
    for (const label of ["Activity log", "Files", "Notes"])
      await page
        .getByTestId("tabs-basic")
        .getByRole("tab", { name: label, exact: true })
        .click();
    for (const theme of THEME_LABELS)
      await page.getByRole("radio", { name: theme, exact: true }).click();
    if (mode !== "anima") {
      await expect(page.locator("anima-icon")).toHaveCount(0);
      await expect(page.locator("[data-anima=ready]")).toHaveCount(0);
    }
    c.expectClean();
  });
}
for (const motion of ["anima", "css"]) {
  test(`keyboard and semantics: ${motion}`, async ({ page }) => {
    await go(page, "tabs", `motion=${motion}`);
    await settled(page, motion === "anima");
    const root = page.getByTestId("tabs-basic");
    const notes = root.getByRole("tab", { name: "Notes", exact: true }),
      files = root.getByRole("tab", { name: "Files", exact: true });
    await expect(notes).toHaveAttribute("aria-selected", "true");
    await expect(root.getByRole("tab", { name: "Locked" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await notes.focus();
    await page.keyboard.press("End");
    await expect(files).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(files).toHaveAttribute("aria-selected", "true");
    await expect(root.getByRole("tabpanel")).toHaveText(
      "Documents attached to this project.",
    );
    expect(
      await files.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
    await page.keyboard.press("ArrowRight");
    await expect(notes).toBeFocused();
    await page.keyboard.press("Space");
    await expect(notes).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Home");
    await expect(notes).toBeFocused();
    await expectDecorativeOnly(page);
  });
}
test("drawing mounts at rest, follows pointer, keyboard, controlled props and resize", async ({
  page,
}) => {
  await go(page, "tabs");
  await settled(page, true);
  const basic = page.getByTestId("tabs-basic"),
    part = basic.locator("[data-golem-part]");
  await expectAligned(
    part,
    basic.getByRole("tab", { name: "Notes", exact: true }),
    true,
  );
  await basic.getByRole("tab", { name: "Activity log", exact: true }).click();
  await expectAligned(
    part,
    basic.getByRole("tab", { name: "Activity log", exact: true }),
    true,
  );
  await page.keyboard.press("End");
  // Wait for roving focus (Radix moves it in a setTimeout) before activating.
  await expect(basic.getByRole("tab", { name: "Files", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expectAligned(
    part,
    basic.getByRole("tab", { name: "Files", exact: true }),
    true,
  );
  await page.getByTestId("tabs-external").click();
  const controlled = page.getByTestId("tabs-controlled");
  await expectAligned(
    controlled.locator("[data-golem-part]"),
    controlled.getByRole("tab", { name: "Files", exact: true }),
  );
  await basic
    .getByRole("tab", { name: "Files", exact: true })
    .evaluate((el) => (el.style.paddingInline = "32px"));
  await expectAligned(
    part,
    basic.getByRole("tab", { name: "Files", exact: true }),
    true,
  );
  await page.setViewportSize({ width: 400, height: 800 });
  await expectAligned(
    part,
    basic.getByRole("tab", { name: "Files", exact: true }),
    true,
  );
});
for (const theme of THEMES)
  test(`theme ${theme}`, async ({ page }) => {
    await go(page, "tabs", `motion=anima&theme=${theme}`);
    await settled(page, true);
    const part = page.getByTestId("tabs-basic").locator("[data-golem-part]");
    expect(await iconFill(part, "focusRing")).toBe(
      await resolvedColor(page, "var(--onyx-control-focus-ring)"),
    );
    expect(
      await page
        .getByTestId("tabs-plain")
        .getByRole("tab", { name: "Notes", exact: true })
        .evaluate((el) => getComputedStyle(el).borderBottomColor),
    ).toBe(await iconFill(part, "focusRing"));
    expect(
      await iconFill(
        page.getByTestId("tabs-controlled").locator("[data-golem-part]"),
        "panel",
      ),
    ).toBe(await resolvedColor(page, "var(--onyx-surface-panel)"));
  });
test("OS reduced motion uses Onyx", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "tabs", "motion=system");
  await settled(page, false);
  await expect(page.locator("anima-icon")).toHaveCount(0);
  await page
    .getByTestId("tabs-basic")
    .getByRole("tab", { name: "Files", exact: true })
    .click();
  await expect(
    page
      .getByTestId("tabs-basic")
      .getByRole("tab", { name: "Files", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
test("missing scene leaves Onyx painting", async ({ page }) => {
  await page.route("**/anima/scenes/tabs.ani", (r) =>
    r.fulfill({ status: 500, body: "" }),
  );
  await go(page, "tabs");
  await expect(page.getByTestId("runtime")).toHaveText("ready");
  await expect(
    page.locator('[data-golem-part="tabs"][data-anima="off"]'),
  ).toHaveCount(2);
  const tab = page
    .getByTestId("tabs-basic")
    .getByRole("tab", { name: "Notes", exact: true });
  expect(
    await tab.evaluate((el) => getComputedStyle(el).borderBottomColor),
  ).toBe(await resolvedColor(page, "var(--onyx-control-focus-ring)"));
});
for (const motion of ["anima", "css"])
  test(`phone ${motion}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await go(page, "tabs", `motion=${motion}`);
    await settled(page, motion === "anima");
    await expectNoHorizontalOverflow(page);
  });
