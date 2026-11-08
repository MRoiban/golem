import { expect, test, type Page } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, THEME_LABELS, settled, watchConsole, expectDecorativeOnly, expectNoHorizontalOverflow, resolvedColor } from "./helpers";
export type Action = "button" | "spinner" | "progress" | "meter";
export async function exercise(page: Page, name: Action) {
  if (name === "button") {
    for (const variant of ["default", "destructive", "secondary", "outline", "ghost", "link"]) await page.getByTestId(`variant-${variant}`).click();
    await page.getByTestId("save").click(); await expect(page.getByTestId("save")).not.toHaveAttribute("aria-busy", "true");
    await page.getByTestId("save-error").click(); await expect(page.getByTestId("save-error")).not.toHaveAttribute("aria-busy", "true");
    await page.getByRole("button", { name: "Show success", exact: true }).click();
    await page.getByRole("button", { name: "Show error", exact: true }).click();
    await page.getByRole("button", { name: "Clear result", exact: true }).click();
  } else if (name !== "spinner") {
    await page.getByRole("button", { name: `Change ${name}` }).click();
    await page.locator("input[type=range]").focus(); await page.keyboard.press("Home"); await page.keyboard.press("End");
  }
}
export const values = (page: Page, testId: string) => page.getByTestId(testId).evaluate(b => {
  const icon = b.closest("[data-golem-part]")!.querySelector("anima-icon") as HTMLElement & { values(): Record<string, number> };
  return icon.values();
});
export function commonTests(name: Action) {
  test.describe(name, () => {
  test.describe("console and interaction", () => {
    for (const q of ["motion=anima", "motion=css", "motion=reduced", "anima=off&motion=anima"]) test(q, async ({ page }) => {
      test.skip(q === "motion=anima" && !HAS_ANIMA, NEEDS_ANIMA);
      const c = watchConsole(page); await page.goto(`/?c=${name}&${q}`); await settled(page, q === "motion=anima");
      await exercise(page, name);
      for (const label of THEME_LABELS) await page.getByRole("radio", { name: label, exact: true }).click();
      await expectDecorativeOnly(page); c.expectClean();
    });
  });
  for (const motion of ["anima", "css"]) test(`semantics and keyboard: ${motion}`, async ({ page }) => {
    test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=${name}&motion=${motion}`); await settled(page, motion === "anima");
    await expectDecorativeOnly(page);
    if (name === "button") {
      const b = page.getByTestId("variant-default"); await expect(b).toHaveRole("button"); await expect(b).toHaveAccessibleName("default");
      await b.focus(); await page.keyboard.press("Space"); await page.keyboard.press("Enter");
      await expect(page.getByTestId("click-count")).toHaveText("Activations: 2");
      expect(await b.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe("none");
      await expect(page.getByRole("button", { name: "Disabled", exact: true })).toBeDisabled();
      await page.getByTestId("save-error").focus(); await page.keyboard.press("Tab"); await expect(page.getByTestId("loading")).toBeFocused();
      await expect(page.getByTestId("as-child")).toHaveRole("link");
      await page.getByTestId("save").focus(); await page.keyboard.press("Enter");
      await expect(page.getByTestId("save")).toHaveAccessibleName("Save");
      await expect(page.getByTestId("save").locator("..").getByRole("status")).toHaveText("Success");
      await expect(page.getByTestId("save")).not.toHaveAttribute("aria-busy", "true");
      // The region exists before the result text changes; fallback announces the same result.
      const region = page.getByTestId("result").locator("..").getByRole("status");
      await expect(region).toHaveAttribute("aria-live", "polite"); await expect(region).toHaveText("");
      await page.getByRole("button", { name: "Show error", exact: true }).click(); await expect(region).toHaveText("Error");
      await page.getByRole("button", { name: "Clear result", exact: true }).click(); await expect(region).toHaveText("");
    } else if (name === "spinner") {
      for (const size of ["xs", "sm", "md", "lg"]) await expect(page.getByRole("status", { name: `Loading ${size}`, exact: true })).toBeVisible();
      expect(await page.locator("[data-golem-part] [tabindex]").count()).toBe(0);
    } else {
      const track = name === "meter" ? page.getByTestId("controlled").getByRole("meter") : page.getByTestId("controlled");
      await expect(track).toHaveRole(name === "meter" ? "meter" : "progressbar");
      await expect(track).toHaveAccessibleName(name === "meter" ? "Usage" : "Upload");
      await page.locator("input[type=range]").focus(); await page.keyboard.press("End"); await expect(track).toHaveAttribute("aria-valuenow", "100");
      await page.keyboard.press("Home"); await expect(track).toHaveAttribute("aria-valuenow", "0");
      await page.keyboard.press("ArrowRight"); await expect(track).toHaveAttribute("aria-valuenow", "1");
      if (name === "progress") await expect(page.getByTestId("indeterminate")).not.toHaveAttribute("aria-valuenow");
    }
  });
  for (const theme of THEMES) test(`theme ${theme}`, async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto(`/?c=${name}&motion=anima&theme=${theme}`); await settled(page, true);
    if (name === "button" || name === "spinner") {
      const id = name === "button" ? "loading" : "spinner-md";
      const colors = await page.getByTestId(id).evaluate(b => {
        const svg = b.querySelector("anima-icon")!.shadowRoot!;
        return [getComputedStyle(svg.querySelector("[stroke='currentColor']")!).stroke, getComputedStyle(b).color];
      });
      expect(colors[0]).toBe(colors[1]);
    } else {
      const tone = name === "meter" ? "success" : "info";
      const color = await page.getByTestId("controlled").evaluate((b, tone) => getComputedStyle(b.querySelector("anima-icon")!.shadowRoot!.querySelector(`[fill*='${tone}Fg']`)!).fill, tone);
      expect(color).toBe(await resolvedColor(page, `var(--onyx-tone-${tone}-fg)`));
    }
  });
  for (const q of ["motion=reduced", "motion=anima&anima=off", "motion=css"]) test(`plain Onyx: ${q}`, async ({ page }) => {
    const c = watchConsole(page); await page.goto(`/?c=${name}&${q}`); await settled(page, false);
    await expect(page.locator("anima-icon")).toHaveCount(0);
    const paint = name === "button" ? page.getByTestId("loading").locator("[data-slot=button-spinner]") : name === "spinner" ? page.getByTestId("spinner-md") : page.getByTestId("controlled").locator(`[data-slot=${name}-indicator]`);
    await expect(paint).toBeVisible();
    expect(await paint.evaluate(e => getComputedStyle(e).visibility)).toBe("visible");
    await exercise(page, name); c.expectClean();
  });
  test.describe("OS reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("system falls back", async ({ page }) => {
      await page.goto(`/?c=${name}&motion=system`); await settled(page, false); await expect(page.locator("anima-icon")).toHaveCount(0); await exercise(page, name);
    });
  });
  test.describe("phone", () => {
    test.use({ viewport: { width: 360, height: 780 } });
    for (const motion of ["anima", "css"]) test(motion, async ({ page }) => {
      test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
      await page.goto(`/?c=${name}&motion=${motion}`); await settled(page, motion === "anima"); await exercise(page, name); await expectNoHorizontalOverflow(page);
    });
  });
  });
}
