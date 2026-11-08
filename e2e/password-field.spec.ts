import { expect, test, type Page } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, THEME_LABELS, settled, watchConsole, expectDecorativeOnly, expectNoHorizontalOverflow, resolvedColor } from "./helpers";
const wrap = (page: Page, id: string) => page.getByTestId(id).locator("xpath=../..");
const toggle = (page: Page, id: string) => wrap(page, id).getByRole("button");
const values = (page: Page, id: string) => wrap(page, id).locator("anima-icon").evaluate((e) => (e as HTMLElement & { values(): Record<string, number> }).values());

for (const q of ["motion=anima", "motion=css", "motion=reduced", "anima=off&motion=anima"]) {
  test(`console and interactions ${q}`, async ({ page }) => {
    test.skip(q === "motion=anima" && !HAS_ANIMA, NEEDS_ANIMA);
    const c = watchConsole(page);
    await page.goto(`/?c=password-field&${q}`);
    await settled(page, q === "motion=anima");
    for (const id of ["empty", "filled", "revealed", "controlled", "plain"]) {
      await toggle(page, id).click(); await toggle(page, id).click();
    }
    await page.getByTestId("empty").fill("a new password");
    await page.getByRole("button", { name: "Change visibility" }).click();
    for (const theme of THEME_LABELS) await page.getByRole("radio", { name: theme, exact: true }).click();
    c.expectClean();
  });
}
for (const motion of ["anima", "css"]) {
  test(`roles, keyboard, pointer and disabled ${motion}`, async ({ page }) => {
    test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=password-field&motion=${motion}`);
    await settled(page, motion === "anima");
    const input = page.getByLabel("Filled password", { exact: true });
    await expect(input).toHaveAttribute("type", "password");
    const button = toggle(page, "filled");
    await expect(button).toHaveAccessibleName("Show password");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await input.focus(); await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    expect(await button.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe("none");
    await page.keyboard.press("Space");
    await expect(input).toHaveAttribute("type", "text");
    await expect(button).toHaveAccessibleName("Hide password");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveValue("correct-horse");
    // Click the exact centre where the drawing is painted; keep Onyx's mouse focus behaviour.
    await input.focus(); await button.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("type", "text");
    await expect(page.getByTestId("disabled")).toBeDisabled();
    await expect(toggle(page, "disabled")).toBeDisabled();
    await page.getByRole("button", { name: "Change visibility" }).click();
    await expect(page.getByTestId("controlled")).toHaveAttribute("type", "text");
    await toggle(page, "revealed").click();
    await expect(page.getByTestId("revealed")).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Reset revealed password" }).click();
    await expect(page.getByTestId("revealed")).toHaveAttribute("type", "text");
    await expectDecorativeOnly(page);
  });
}

test("drawing follows pointer, keyboard, controlled props and starts at rest", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=password-field&motion=anima");
  await settled(page, true);
  expect((await values(page, "revealed"))["slash.scaleX"]).toBe(1);
  // Mounted revealed: slash drawn, and no blink in flight (the eye is at full height).
  expect((await values(page, "revealed"))["eye.scaleY"] ?? 1).toBeCloseTo(1, 2);
  expect((await values(page, "filled"))["slash.scaleX"] ?? 0).toBe(0);
  await toggle(page, "filled").click();
  await expect.poll(async () => (await values(page, "filled"))["slash.scaleX"]).toBe(1);
  await toggle(page, "filled").press("Enter");
  await expect.poll(async () => (await values(page, "filled"))["slash.scaleX"] ?? 0).toBe(0);
  await expect.poll(async () => (await values(page, "filled"))["eye.scaleY"] ?? 1).toBeCloseTo(1, 2);
  await page.getByRole("button", { name: "Change visibility" }).click();
  await expect.poll(async () => (await values(page, "controlled"))["slash.scaleX"]).toBe(1);
  const geometry = await toggle(page, "filled").evaluate((b) => {
    const icon = b.querySelector("[data-slot='icon']")!, drawing = b.querySelector("anima-icon")!;
    const a = icon.getBoundingClientRect(), c = drawing.getBoundingClientRect();
    return { icon: [a.x + a.width / 2, a.y + a.height / 2, a.width, parseFloat(getComputedStyle(icon).fontSize)], drawing: [c.x + c.width / 2, c.y + c.height / 2, c.width, c.height], hidden: getComputedStyle(icon, "::before").visibility };
  });
  expect(geometry.hidden).toBe("hidden");
  for (let i = 0; i < 4; i++) expect(Math.abs(geometry.icon[i]! - geometry.drawing[i]!)).toBeLessThan(0.2);
});
for (const theme of THEMES) {
  test(`theme ${theme}`, async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=password-field&motion=anima&theme=${theme}`);
    await settled(page, true);
    const paint = await toggle(page, "filled").locator("anima-icon").evaluate((e) => getComputedStyle(e.shadowRoot!.querySelector("path")!).stroke);
    const plain = await toggle(page, "plain").locator("[data-slot='icon']").evaluate((e) => getComputedStyle(e).color);
    expect(paint).toBe(plain);
    expect(paint).toBe(await resolvedColor(page, "var(--onyx-text-foreground)"));
  });
}
for (const q of ["motion=reduced", "motion=system", "motion=anima&anima=off"]) {
  test(`plain Onyx fallback ${q}`, async ({ page }) => {
    if (q === "motion=system") await page.emulateMedia({ reducedMotion: "reduce" });
    const c = watchConsole(page);
    await page.goto(`/?c=password-field&${q}`);
    await settled(page, false);
    await expect(page.locator("anima-icon")).toHaveCount(0);
    expect(await toggle(page, "filled").locator("[data-slot='icon']").evaluate((e) => getComputedStyle(e).visibility)).toBe("visible");
    await toggle(page, "filled").click();
    await expect(page.getByTestId("filled")).toHaveAttribute("type", "text");
    c.expectClean();
  });
}
for (const motion of ["anima", "css"]) {
  test(`phone ${motion}`, async ({ page }) => {
    test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`/?c=password-field&motion=${motion}`);
    await settled(page, motion === "anima");
    await expectNoHorizontalOverflow(page);
    await toggle(page, "filled").click();
    await expect(page.getByTestId("filled")).toHaveAttribute("type", "text");
  });
}

test("scene failure preserves the Onyx eye and its accessible toggle", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.route("**/anima/scenes/password-field.ani", (r) => r.fulfill({ status: 500, body: "" }));
  const c = watchConsole(page);
  await page.goto("/?c=password-field&motion=anima");
  await expect(page.getByTestId("runtime")).toHaveText("ready");
  await expect(page.locator("[data-golem-part='password-field'][data-anima='off']")).toHaveCount(5);
  expect(await toggle(page, "filled").locator("[data-slot='icon']").evaluate((e) => getComputedStyle(e, "::before").visibility)).toBe("visible");
  await toggle(page, "filled").click();
  await expect(page.getByTestId("filled")).toHaveAttribute("type", "text");
  await expect(toggle(page, "filled")).toHaveAccessibleName("Hide password");
  c.expectClean([/Failed to load resource.*500/, /Anima mount failed/]);
});
