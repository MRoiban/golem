import { test, expect, type Page, type Locator } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, THEME_LABELS, settled, watchConsole, expectDecorativeOnly, expectNoHorizontalOverflow, resolvedColor } from "./helpers";

export const value = (part: Locator, key: string) => part.locator("anima-icon").evaluate((el, k) => (el as HTMLElement & { values(): Record<string, number> }).values()[k], key);
export const partFor = (page: Page, id: string) => page.getByTestId(id).locator("[data-golem-part]");
export async function exercise(page: Page, name: string) {
  if (name === "collapsible") {
    await page.getByTestId("basic").click(); await page.getByRole("button", { name: "Toggle controlled", exact: true }).click();
    await page.getByTestId("custom").click();
  } else if (name === "accordion") {
    await page.getByTestId("advanced").click(); await page.getByTestId("files").click(); await page.getByTestId("history").click();
    await page.getByRole("button", { name: "Change controlled item" }).click();
  } else if (name === "alert") {
    await page.getByRole("button", { name: "Change tone" }).click(); await page.getByRole("button", { name: "Re-render alert" }).click();
  } else {
    for (const tone of ["neutral", "info", "success", "warning", "danger"]) await page.getByRole("button", { name: `Raise ${tone}`, exact: true }).click();
    await page.getByRole("button", { name: "Update latest" }).click();
    await page.getByRole("region", { name: "Demo notifications" }).hover();
    await page.getByRole("button", { name: "Dismiss notification" }).last().click();
  }
}

export function disclosureBasics(name: string) {
  test.describe(name, () => {
  for (const mode of ["anima", "css", "reduced", "missing"]) {
    test(`clean console and interactions in every theme (${mode})`, async ({ page }) => {
      test.skip(mode === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
      const c = watchConsole(page);
      await page.goto(`/?c=${name}&motion=${mode === "missing" ? "anima&anima=off" : mode}`);
      await settled(page, mode === "anima");
      for (const label of THEME_LABELS) {
        await page.getByRole("radio", { name: label, exact: true }).click();
        await exercise(page, name);
      }
      await expectDecorativeOnly(page);
      c.expectClean();
    });
  }
  test("all six themes use Onyx foreground slots, live without remounting", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=${name}&motion=anima`); await settled(page, true);
    const icon = page.locator("[data-golem-part] anima-icon").first();
    const handle = await icon.elementHandle();
    for (let i = 0; i < THEMES.length; i++) {
      await page.getByRole("radio", { name: THEME_LABELS[i]!, exact: true }).click();
      // Use current root's theme; THEME_LABELS has a different order from THEMES.
      const nodes = await page.locator("[data-golem-part] anima-icon").all();
      for (const node of nodes) {
        const colors = await node.evaluate(el => {
          const host = el.closest("[data-icon-tone]");
          const tone = host?.getAttribute("data-icon-tone");
          const slot = tone ? (tone === "neutral" ? "infoFg" : `${tone}Fg`) : "desc";
          const shape = el.shadowRoot!.querySelector(`[stroke*='--anima-${slot}']`)!;
          const probe = document.createElement("span");
          probe.style.color = `var(${tone ? "--onyx-display-fg" : "--onyx-text-description"})`;
          el.parentElement!.append(probe);
          const expected = getComputedStyle(probe).color; probe.remove();
          return { actual: getComputedStyle(shape).stroke, expected };
        });
        expect(colors.actual).toBe(colors.expected);
      }
    }
    expect(await handle!.evaluate(el => el.isConnected)).toBe(true);
    if (name === "collapsible" || name === "accordion") {
      const stroke = await icon.evaluate(el => getComputedStyle(el.shadowRoot!.querySelector("path")!).stroke);
      expect(stroke).toBe(await resolvedColor(page, "var(--onyx-text-description)"));
    }
  });
  for (const mode of ["reduced", "system", "missing"]) {
    test(`plain Onyx fallback: ${mode}`, async ({ page }) => {
      const c = watchConsole(page);
      if (mode === "system") await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/?c=${name}&motion=${mode === "missing" ? "anima&anima=off" : mode}`);
      await settled(page, false);
      await expect(page.locator("anima-icon")).toHaveCount(0);
      const visual = page.locator(name === "alert" ? "[data-testid='info'] .codicon" : name === "toast" ? ".golem-toast-viewport [data-slot='toast-icon'] > .codicon" : `[data-slot='${name}-chevron']`).first();
      await expect(visual).toBeVisible();
      await exercise(page, name); c.expectClean();
    });
  }
  for (const motion of ["anima", "css"]) {
    test(`phone width (${motion})`, async ({ page }) => {
      test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
      await page.setViewportSize({ width: 360, height: 780 });
      await page.goto(`/?c=${name}&motion=${motion}`); await settled(page, motion === "anima");
      await exercise(page, name); await expectNoHorizontalOverflow(page);
    });
  }
  test("failed scene preserves original Onyx painting", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    const c = watchConsole(page);
    await page.route(`**/anima/scenes/${name}.ani`, route => route.fulfill({ status: 500, body: "" }));
    await page.goto(`/?c=${name}&motion=anima`);
    await expect(page.getByTestId("runtime")).toHaveText("ready");
    await expect(page.locator("[data-golem-part][data-anima='ready']")).toHaveCount(0);
    await expect(page.locator("[data-golem-part][data-anima='pending']")).toHaveCount(0);
    const icon = page.locator(name === "alert" ? "[data-testid='info'] .codicon" : name === "toast" ? ".golem-toast-viewport [data-slot='toast-icon'] > .codicon" : `[data-slot='${name}-chevron']`).first();
    await expect(icon).toBeVisible();
    await exercise(page, name);
    c.expectClean([/Failed to load resource.*500/, /Anima mount failed/]);
  });
  test("switching motion restores Onyx and remounts at rest", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=${name}&motion=anima`); await settled(page, true);
    await page.getByRole("radio", { name: "Reduced", exact: true }).click();
    await expect(page.locator("anima-icon")).toHaveCount(0);
    await page.getByRole("radio", { name: "Anima", exact: true }).click(); await settled(page, true);
    if (name === "alert" || name === "toast") {
      expect(await value(page.locator("[data-golem-part]").first(), "info-ring.stroke.trimEnd")).toBe(1);
    }
  });
  });
}

export async function visibleFocus(button: Locator, page: Page) {
  await button.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  const ring = await button.evaluate(el => { const css = getComputedStyle(el); return { shadow: css.boxShadow, outline: css.outlineStyle }; });
  expect(ring.shadow !== "none" || ring.outline !== "none").toBe(true);
}
