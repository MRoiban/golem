import { expect, test, type Page } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, THEME_LABELS, expectDecorativeOnly, expectNoHorizontalOverflow, resolvedColor, settled, watchConsole } from "./helpers";

export const values = (page: Page, id: string) => page.getByTestId(id).evaluate((el) => {
  const icon = el.closest(".golem-part")!.querySelector("anima-icon") as HTMLElement & { values(): Record<string, number> };
  return icon.values();
});

// Radix schedules arrow focus on a timer. Keep the key held until that focus/selection lands,
// as a real keypress does; an instantaneous keyup can overtake it on this shared machine.
export async function arrow(page: Page, key: string, id: string) {
  await page.keyboard.down(key);
  try {
    await expect(page.getByTestId(id)).toBeFocused();
    await expect(page.getByTestId(id)).toBeChecked();
  } finally { await page.keyboard.up(key); }
}

export async function exercise(page: Page, name: string) {
  if (name === "checkbox") {
    const off = page.getByTestId("check-off");
    const before = await off.isChecked();
    await off.click();
    await expect(off).toBeChecked({ checked: !before });
    await off.focus(); await page.keyboard.press("Space");
    await expect(off).toBeChecked({ checked: before });
    for (const label of ["Set mixed", "Set unchecked", "Set checked"]) await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByTestId("check-controlled")).toBeChecked();
  } else if (name === "radio-group") {
    await page.getByTestId("radio-fast").click();
    await arrow(page, "ArrowDown", "radio-balanced");
    await page.getByTestId("radio-best").click();
    await expect(page.getByTestId("radio-best")).toBeChecked();
    await page.getByRole("button", { name: "Change quality" }).click();
  } else {
    const icon = page.getByTestId("toggle-icon");
    const before = await icon.getAttribute("aria-pressed");
    await icon.click();
    await expect(icon).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
    await page.keyboard.press("Space");
    await expect(icon).toHaveAttribute("aria-pressed", before!);
    await page.getByTestId("toggle-text").click();
    await page.getByRole("button", { name: "Change pressed" }).click();
  }
}

/** Each component runs the same fallback, colour, console and responsive contract in both browsers. */
export function choiceContract(name: string, slots: Record<string, string>, paintedId: string) {
  test.describe(`${name} contract`, () => {
    for (const q of ["motion=anima", "motion=css", "motion=reduced", "anima=off&motion=anima"]) {
      test(`console and interactions: ${q}`, async ({ page }) => {
        test.skip(q === "motion=anima" && !HAS_ANIMA, NEEDS_ANIMA);
        const log = watchConsole(page);
        await page.goto(`/?c=${name}&${q}`);
        await settled(page, q === "motion=anima");
        await exercise(page, name);
        for (const label of THEME_LABELS) await page.getByRole("radio", { name: label, exact: true }).click();
        await expectDecorativeOnly(page);
        if (q !== "motion=anima") {
          await expect(page.locator("anima-icon")).toHaveCount(0);
          // The original paint is visible in every fallback mode.
          const visiblePaint = await page.getByTestId(paintedId).evaluate((el, group) => {
            const paint = group === "radio-group" ? el.querySelector("[data-slot='radio-group-indicator']")! : el;
            return { visibility: getComputedStyle(paint).visibility, background: getComputedStyle(paint).backgroundColor };
          }, name);
          expect(visiblePaint.visibility).toBe("visible");
          expect(visiblePaint.background).not.toBe("rgba(0, 0, 0, 0)");
        }
        log.expectClean();
      });
    }
    for (const theme of THEMES) test(`slots: ${theme}`, async ({ page }) => {
      test.skip(!HAS_ANIMA, NEEDS_ANIMA);
      await page.goto(`/?c=${name}&motion=anima&theme=${theme}`);
      await settled(page, true);
      const handle = await page.getByTestId(paintedId).evaluateHandle((el) => el.closest(".golem-part")!.querySelector("anima-icon")!);
      const assertSlots = async () => {
        for (const [slot, token] of Object.entries(slots)) {
          const fill = await handle.evaluate((icon, s) => getComputedStyle(icon.shadowRoot!.querySelector(`[fill*="--anima-${s}"], [stroke*="--anima-${s}"]`)!).getPropertyValue(s === "buttonFg" && icon.shadowRoot!.querySelector(`[stroke*="--anima-${s}"]`) ? "stroke" : "fill"), slot);
          expect(fill).toBe(await resolvedColor(page, `var(--onyx-${token})`));
        }
      };
      await assertSlots();
      await page.getByRole("radio", { name: "Rose", exact: true }).click();
      await assertSlots();
      expect(await handle.evaluate((el) => el.isConnected)).toBe(true);
    });
    test.describe("OS reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      test("system falls back to Onyx", async ({ page }) => {
        const log = watchConsole(page);
        await page.goto(`/?c=${name}&motion=system`);
        await expect(page.getByTestId("motion")).toHaveText("reduced");
        await expect(page.locator("anima-icon")).toHaveCount(0);
        await exercise(page, name);
        log.expectClean();
      });
    });
    test.describe("phone", () => {
      test.use({ viewport: { width: 360, height: 780 } });
      for (const motion of ["anima", "css"]) test(motion, async ({ page }) => {
        test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
        await page.goto(`/?c=${name}&motion=${motion}`);
        await settled(page, motion === "anima");
        await exercise(page, name);
        await expectNoHorizontalOverflow(page);
      });
    });
  });
}
