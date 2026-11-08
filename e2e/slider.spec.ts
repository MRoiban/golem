import { expect, test, type Locator } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, THEME_LABELS, settled, watchConsole, expectDecorativeOnly, expectNoHorizontalOverflow, resolvedColor, pauseParts } from "./helpers";

const thumb = (root: Locator, n = 0) => root.getByRole("slider").nth(n);
const values = (root: Locator) => root.locator("anima-icon").first().evaluate((i) => (i as HTMLElement & { values(): Record<string, number> }).values());
async function aligned(root: Locator) {
  for (const t of await root.getByRole("slider").all()) {
    const boxes = await t.evaluate((el) => {
      const icon = el.querySelector("anima-icon")!;
      const a = el.getBoundingClientRect(), b = icon.getBoundingClientRect();
      const ink = icon.shadowRoot!.querySelector("circle")!.getBoundingClientRect();
      return { inkX: Math.abs(a.x + a.width / 2 - ink.x - ink.width / 2), inkY: Math.abs(a.y + a.height / 2 - ink.y - ink.height / 2), x: Math.abs(a.x + a.width / 2 - b.x - b.width / 2), y: Math.abs(a.y + a.height / 2 - b.y - b.height / 2), w: Math.abs(a.width - b.width), h: Math.abs(a.height - b.height) };
    });
    for (const error of Object.values(boxes)) expect(error).toBeLessThan(0.1);
  }
}

for (const q of ["motion=anima", "motion=css", "motion=reduced", "anima=off&motion=anima"]) {
  test(`console and interactions ${q}`, async ({ page }) => {
    test.skip(q === "motion=anima" && !HAS_ANIMA, NEEDS_ANIMA);
    const c = watchConsole(page);
    await page.goto(`/?c=slider&${q}`);
    await settled(page, q === "motion=anima");
    for (const id of ["single", "range", "stepped", "controlled", "vertical", "plain"]) {
      await thumb(page.getByTestId(id)).focus();
      await page.keyboard.press("ArrowUp");
    }
    await thumb(page.getByTestId("range"), 1).press("ArrowLeft");
    await page.getByRole("button", { name: "Set level to 80" }).click();
    for (const theme of THEME_LABELS) await page.getByRole("radio", { name: theme, exact: true }).click();
    c.expectClean();
  });
}

for (const motion of ["anima", "css"]) {
  test(`semantics, keyboard, pointer and disabled ${motion}`, async ({ page }) => {
    test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=slider&motion=${motion}`);
    await settled(page, motion === "anima");
    const single = page.getByRole("slider", { name: "Volume", exact: true });
    await expect(single).toHaveAttribute("aria-valuemin", "0");
    await expect(single).toHaveAttribute("aria-valuemax", "100");
    await expect(single).toHaveAttribute("aria-valuenow", "35");
    await single.focus();
    await page.keyboard.press("ArrowRight");
    await expect(single).toHaveAttribute("aria-valuenow", "36");
    await page.keyboard.press("End");
    await expect(single).toHaveAttribute("aria-valuenow", "100");
    await page.keyboard.press("Home");
    await expect(single).toHaveAttribute("aria-valuenow", "0");
    await expect(single).toBeFocused();
    expect(await single.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe("none");
    const steps = page.getByRole("slider", { name: "Steps", exact: true });
    await steps.press("ArrowRight");
    await expect(steps).toHaveAttribute("aria-valuenow", "40");
    await thumb(page.getByTestId("range"), 0).press("ArrowRight");
    await expect(thumb(page.getByTestId("range"), 0)).toHaveAttribute("aria-valuenow", "26");
    await thumb(page.getByTestId("range"), 1).press("ArrowLeft");
    await expect(thumb(page.getByTestId("range"), 1)).toHaveAttribute("aria-valuenow", "74");
    await thumb(page.getByTestId("vertical")).press("ArrowUp");
    await expect(thumb(page.getByTestId("vertical"))).toHaveAttribute("aria-valuenow", "41");
    await page.getByRole("button", { name: "Set level to 80" }).click();
    await expect(thumb(page.getByTestId("controlled"))).toHaveAttribute("aria-valuenow", "80");
    await expect(page.getByText("Controlled · 80", { exact: true })).toBeVisible();
    const disabled = thumb(page.getByTestId("disabled"));
    await expect(disabled).toHaveAttribute("data-disabled", "");
    expect(await disabled.getAttribute("tabindex")).not.toBe("0");
    await disabled.click({ force: true });
    await expect(disabled).toHaveAttribute("aria-valuenow", "45");
    await expectDecorativeOnly(page);
    // A track click goes through decoration to Radix.
    await page.getByTestId("single").click({ position: { x: 200, y: 8 } });
    expect(Number(await single.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Reset volume" }).click();
    await expect(single).toHaveAttribute("aria-valuenow", "35");
  });
}

test("drawing at rest, keyboard pop, and exact positions throughout captured drags", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=slider&motion=anima");
  await settled(page, true);
  const single = page.getByTestId("single");
  expect((await values(single))["thumb.scaleX"] ?? 1).toBe(1);
  for (const id of ["single", "range", "vertical", "controlled", "disabled"]) await aligned(page.getByTestId(id));
  const step = await pauseParts(page, "[data-testid='single']");
  // Press an unchanged thumb while it is unfocused: focus is a separate DOM event from value.
  const knob = (await thumb(single).boundingBox())!;
  await page.mouse.move(knob.x + knob.width / 2, knob.y + knob.height / 2);
  await page.mouse.down();
  await expect(thumb(single)).toBeFocused();
  await page.waitForTimeout(50);
  await step(0); await step(0.1);
  expect((await values(single))["thumb.scaleY"]).toBeCloseTo(0.86, 2);
  await aligned(single);
  await page.mouse.up(); await page.waitForTimeout(50);
  await step(0); await step(0.16);
  await thumb(single).press("ArrowRight");
  await step(0); await step(0.06);
  expect((await values(single))["pulse.scaleX"]).toBeGreaterThan(1.1);
  await step(0.2);
  // Pointerdown on a track selects one thumb; the other range thumb stays at rest.
  for (const id of ["single", "range", "vertical"]) {
    const root = page.getByTestId(id);
    await root.scrollIntoViewIfNeeded();
    const box = (await root.boundingBox())!;
    const vertical = id === "vertical";
    const x = box.x + (vertical ? 8 : box.width * 0.2), y = box.y + (vertical ? box.height * 0.7 : 8);
    await page.mouse.move(x, y); await page.mouse.down();
    if (id === "single") { await step(0); await step(0.1); }
    for (const fraction of [0.35, 0.5, 0.65]) {
      await page.mouse.move(vertical ? x : box.x + box.width * fraction, vertical ? box.y + box.height * fraction : y);
      await aligned(root); // before pointerup: no eased value-to-position delay
    }
    const selected = root.getByRole("slider").locator("anima-icon");
    if (id === "single") expect((await values(root))["thumb.scaleY"]).toBeCloseTo(0.86, 2);
    else await expect.poll(async () => selected.evaluateAll((els) => els.some((e) => ((e as HTMLElement & { values(): Record<string, number> }).values()["thumb.scaleY"] ?? 1) < 0.9))).toBe(true);
    if (id === "range") {
      expect((await values(root))["thumb.scaleY"] ?? 1).toBeCloseTo(0.86, 2);
      const other = await root.locator("anima-icon").nth(1).evaluate((e) => (e as HTMLElement & { values(): Record<string, number> }).values()["thumb.scaleY"] ?? 1);
      expect(other).toBe(1);
    }
    await page.mouse.up();
  }
  await page.getByRole("button", { name: "Set level to 80" }).click();
  await aligned(page.getByTestId("controlled"));
  // Track and range retain Onyx paint, only thumb paint is swapped.
  expect(await single.locator("[data-slot='slider-range']").evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await thumb(single).evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
});

for (const theme of THEMES) {
  test(`theme ${theme}`, async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=slider&motion=anima&theme=${theme}`);
    await settled(page, true);
    const paint = await thumb(page.getByTestId("single")).locator("anima-icon").evaluate((e) => {
      const circle = e.shadowRoot!.querySelector("circle")!;
      return { fill: getComputedStyle(circle).fill, stroke: getComputedStyle(circle).stroke };
    });
    expect(paint.fill).toBe(await resolvedColor(page, "var(--onyx-text-inverse)"));
    expect(paint.stroke).toBe(await resolvedColor(page, "var(--onyx-control-focus-ring)"));
    expect(await thumb(page.getByTestId("plain")).evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(paint.fill);
  });
}

for (const q of ["motion=reduced", "motion=system", "motion=anima&anima=off"]) {
  test(`plain Onyx fallback ${q}`, async ({ page }) => {
    if (q === "motion=system") await page.emulateMedia({ reducedMotion: "reduce" });
    const c = watchConsole(page);
    await page.goto(`/?c=slider&${q}`);
    await settled(page, false);
    await expect(page.locator("anima-icon")).toHaveCount(0);
    const single = thumb(page.getByTestId("single"));
    expect(await single.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
    await single.press("ArrowRight");
    await expect(single).toHaveAttribute("aria-valuenow", "36");
    c.expectClean();
  });
}
for (const motion of ["anima", "css"]) {
  test(`phone ${motion}`, async ({ page }) => {
    test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`/?c=slider&motion=${motion}`);
    await settled(page, motion === "anima");
    await expectNoHorizontalOverflow(page);
    await thumb(page.getByTestId("single")).press("ArrowRight");
    await expect(thumb(page.getByTestId("single"))).toHaveAttribute("aria-valuenow", "36");
  });
}

test("scene failure leaves every Onyx thumb painted and interactive", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.route("**/anima/scenes/slider.ani", (r) => r.fulfill({ status: 500, body: "" }));
  const c = watchConsole(page);
  await page.goto("/?c=slider&motion=anima");
  await expect(page.getByTestId("runtime")).toHaveText("ready");
  await expect(page.locator("[data-golem-part='slider'][data-anima='off']")).toHaveCount(7);
  const single = thumb(page.getByTestId("single"));
  expect(await single.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  await single.press("ArrowRight");
  await expect(single).toHaveAttribute("aria-valuenow", "36");
  c.expectClean([/Failed to load resource.*500/, /Anima mount failed/]);
});
