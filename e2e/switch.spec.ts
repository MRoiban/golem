import { expect, test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, resolvedColor, settled, watchConsole } from "./helpers";

import { THEMES } from "./helpers";

test.describe("no console errors", () => {
  for (const q of ["motion=anima", "motion=css", "motion=reduced", "anima=off&motion=anima"]) {
    test(q, async ({ page }) => {
      test.skip(q === "motion=anima" && !HAS_ANIMA, NEEDS_ANIMA);
      const c = watchConsole(page);
      await page.goto(`/?c=switch&${q}`);
      await settled(page, q === "motion=anima");
      for (const id of ["autosave", "sync", "beta"]) await page.getByTestId(id).click();
      for (const t of ["Light", "Rose", "Rose dark", "Flexoki", "Flexoki dark", "Dark"]) await page.getByRole("radio", { name: t, exact: true }).click();
      await page.waitForTimeout(300);
      c.expectClean();
    });
  }
});

test.describe("roles and keyboard", () => {
  for (const motion of ["anima", "css"]) {
    test(`motion=${motion}`, async ({ page }) => {
      test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
      await page.goto(`/?c=switch&motion=${motion}&many=0`);
      await settled(page, motion === "anima");
      const autosave = page.getByRole("switch", { name: "Auto save" });
      await expect(autosave).toHaveAttribute("aria-checked", "true");
      await expect(page.getByRole("switch", { name: "Managed by your organisation" })).toBeDisabled();
      // The Anima drawing adds nothing to the accessibility tree and takes no focus.
      await expect(page.locator("anima-icon:not([aria-hidden='true'])")).toHaveCount(0);
      await expect(page.locator(".golem-anima:not([aria-hidden='true'])")).toHaveCount(0);
      // Tab order: theme group, motion group, then the switches in order.
      await autosave.focus();
      await page.keyboard.press("Space");
      await expect(autosave).toHaveAttribute("aria-checked", "false");
      await page.keyboard.press("Enter");
      await expect(autosave).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("Tab");
      await expect(page.getByRole("switch", { name: "Sync" })).toBeFocused();
      await page.keyboard.press("Space");
      await expect(page.getByText("Controlled: off.")).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("switch", { name: "Beta features" })).toBeFocused();
      await page.keyboard.press("Tab"); // the disabled switch is skipped
      await expect(page.getByRole("switch", { name: "Plain Onyx (reference)" })).toBeFocused();
      // Focus ring stays visible over the Anima drawing.
      await page.getByRole("switch", { name: "Beta features" }).focus();
      await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
      const ring = await page.getByRole("switch", { name: "Beta features" }).evaluate((b) => getComputedStyle(b).boxShadow);
      expect(ring).not.toBe("none");
    });
  }
});

test("the Anima drawing follows the Onyx state", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=switch&motion=anima&many=6");
  await settled(page, true);
  const thumbX = (id: string) => page.getByTestId(id).evaluate((b) => {
    const icon = b.parentElement!.querySelector("anima-icon") as HTMLElement & { values(): Record<string, number> };
    return icon.values()["thumb.x"];
  });
  // Mounted at rest in its current state (no animation from "off" on load).
  expect(await thumbX("autosave")).toBeCloseTo(22.75, 2);
  expect(await thumbX("beta")).toBeCloseTo(8.75, 2);
  await page.getByTestId("beta").click();
  await expect.poll(() => thumbX("beta")).toBeCloseTo(22.75, 2);
  // The overlay always has the Onyx button's box, also inside a stretching grid.
  for (const sw of await page.locator(".golem-switch").all()) {
    const [a, b] = await sw.evaluate((w) => [w.getBoundingClientRect(), w.querySelector("button")!.getBoundingClientRect()].map((r) => `${r.width.toFixed(1)}x${r.height.toFixed(1)}`));
    expect(a).toBe(b);
  }
  // Onyx's own track and thumb are hidden while Anima paints them.
  const thumbHidden = await page.getByTestId("beta").locator("[data-slot='switch-thumb']").evaluate((t) => getComputedStyle(t).visibility);
  expect(thumbHidden).toBe("hidden");
});

test.describe("themes", () => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  for (const theme of THEMES) {
    test(theme, async ({ page }) => {
      await page.goto(`/?c=switch&motion=anima&theme=${theme}&many=0`);
      await settled(page, true);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const onFill = await page.getByTestId("autosave").evaluate((b) => {
        const svg = b.parentElement!.querySelector("anima-icon")!.shadowRoot!;
        return getComputedStyle(svg.querySelector("[fill*=buttonBg]")!).fill;
      });
      expect(onFill).toBe(await resolvedColor(page, "var(--onyx-control-button-bg)"));
      // The plain Onyx reference uses the same colour.
      const plain = await page.getByTestId("plain").evaluate((b) => getComputedStyle(b).backgroundColor);
      expect(plain).toBe(onFill);
    });
  }

  test("theme changes reach mounted Anima controls live", async ({ page }) => {
    await page.goto("/?c=switch&motion=anima&many=0");
    await settled(page, true);
    const handle = await page.getByTestId("autosave").evaluateHandle((b) => b.parentElement!.querySelector("anima-icon")!);
    const fill = () => handle.evaluate((icon) => getComputedStyle(icon.shadowRoot!.querySelector("[fill*=buttonBg]")!).fill);
    const dark = await fill();
    await page.getByRole("radio", { name: "Rose", exact: true }).click();
    await expect.poll(fill).toBe(await resolvedColor(page, "var(--onyx-palette-rose-600)"));
    expect(await fill()).not.toBe(dark);
    expect(await handle.evaluate((icon) => icon.isConnected)).toBe(true); // same element, not remounted
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("system preference: plain Onyx, 1 ms transitions", async ({ page }) => {
    const c = watchConsole(page);
    await page.goto("/?c=switch&motion=system");
    await expect(page.getByTestId("motion")).toHaveText("reduced");
    await expect(page.locator("html")).toHaveAttribute("data-golem-motion", "reduced");
    await expect(page.locator("anima-icon")).toHaveCount(0);
    const t = await page.getByTestId("autosave").evaluate((b) => getComputedStyle(b).transitionDuration);
    expect(t).toBe("0.001s");
    await page.getByTestId("autosave").click();
    await expect(page.getByTestId("autosave")).toHaveAttribute("aria-checked", "false");
    c.expectClean();
  });
});

test("in-app reduced motion without an OS preference", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=switch&motion=anima&many=0");
  await settled(page, true);
  await page.getByRole("radio", { name: "Reduced" }).click();
  await expect(page.locator("anima-icon")).toHaveCount(0); // motion parts unmount
  const t = await page.getByTestId("autosave").locator("[data-slot='switch-thumb']").evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(t).toBe("0.001s");
  await page.getByRole("radio", { name: "Anima" }).click();
  await settled(page, true); // and come back from the cached model
});

test.describe("fallback without Anima", () => {
  test("no runtime configured", async ({ page }) => {
    const c = watchConsole(page);
    await page.goto("/?c=switch&motion=anima&anima=off");
    await expect(page.getByTestId("runtime")).toHaveText("absent");
    await expect(page.locator("anima-icon")).toHaveCount(0);
    await expect(page.locator(".golem-switch[data-anima='ready']")).toHaveCount(0);
    const thumb = page.getByTestId("beta").locator("[data-slot='switch-thumb']");
    await expect(thumb).toBeVisible();
    await page.getByTestId("beta").click();
    await expect(page.getByTestId("beta")).toHaveAttribute("aria-checked", "true");
    c.expectClean();
  });
  test("runtime fails to load (404)", async ({ page }) => {
    await page.route("**/anima/anima.js", (r) => r.fulfill({ status: 404, body: "" }));
    const c = watchConsole(page);
    await page.goto("/?c=switch&motion=anima");
    await expect(page.getByTestId("runtime")).toHaveText("absent");
    await expect(page.locator("anima-icon")).toHaveCount(0);
    await page.getByTestId("beta").click();
    await expect(page.getByTestId("beta")).toHaveAttribute("aria-checked", "true");
    c.expectClean([/Failed to load resource.*404/, /Loading failed for the module/, /Failed to fetch dynamically imported module|error loading dynamically imported module|Loading module from .* was blocked/]);
  });
  test("scene fails to load", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.route("**/anima/scenes/switch.ani", (r) => r.fulfill({ status: 500, body: "" }));
    const c = watchConsole(page);
    await page.goto("/?c=switch&motion=anima&many=0");
    await expect(page.getByTestId("runtime")).toHaveText("ready");
    await expect(page.locator(".golem-switch[data-anima='off']")).toHaveCount(4);
    await expect(page.getByTestId("beta").locator("[data-slot='switch-thumb']")).toBeVisible();
    c.expectClean([/Failed to load resource.*500/, /Anima mount failed/]);
  });
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 360, height: 780 } });
  for (const motion of ["anima", "css"]) {
    test(`no horizontal overflow, motion=${motion}`, async ({ page }) => {
      test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
      await page.goto(`/?c=switch&motion=${motion}`);
      await settled(page, motion === "anima");
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw).toBeLessThanOrEqual(cw);
      await page.getByTestId("beta").click();
      await expect(page.getByTestId("beta")).toHaveAttribute("aria-checked", "true");
    });
  }
});

test.describe("no provider, no code (pebble that only swapped imports)", () => {
  test("motion from the page's meta tags, theme from <html data-theme>", async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    const c = watchConsole(page);
    await page.goto("/?c=switch&provider=off&many=0");
    await expect(page.getByTestId("no-provider")).toBeVisible();
    await settled(page, true);
    await expect(page.locator("html")).not.toHaveAttribute("data-golem-motion", /./);
    await page.getByRole("radio", { name: "Light", exact: true }).click();
    const fill = await page.getByTestId("autosave").evaluate((b) =>
      getComputedStyle(b.parentElement!.querySelector("anima-icon")!.shadowRoot!.querySelector("[fill*=buttonBg]")!).fill);
    expect(fill).toBe(await resolvedColor(page, "var(--onyx-control-button-bg)"));
    c.expectClean();
  });
  test.describe("with the OS asking for reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("plain Onyx", async ({ page }) => {
      await page.goto("/?c=switch&provider=off&many=0");
      await expect(page.getByTestId("motion")).toHaveText("reduced");
      await expect(page.locator("anima-icon")).toHaveCount(0);
    });
  });
});
