import { expect, type Page } from "@playwright/test";

/** Collects console warnings/errors and page errors; `allow` filters expected messages. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return {
    problems,
    expectClean(allow: RegExp[] = []) {
      expect(problems.filter((p) => !allow.some((a) => a.test(p)))).toEqual([]);
    },
  };
}

/** Waits until the demo's Anima runtime state is final and every queued control is mounted. */
export async function settled(page: Page, expectAnima: boolean) {
  // Generous: the runtime import competes with other agents' test suites on the dev machine.
  await expect(page.getByTestId("runtime")).toHaveText(expectAnima ? "ready" : /absent|idle/, { timeout: 45_000 });
  if (expectAnima) {
    // Every Golem part on the page (wrappers carry data-golem-part and data-anima=<status>).
    const total = await page.locator("[data-golem-part]").count();
    await expect(page.locator("[data-golem-part][data-anima='ready']")).toHaveCount(total, { timeout: 45_000 });
  }
}

/** The page's resolved colour of a CSS expression, as rgb(…). */
export const resolvedColor = (page: Page, css: string) =>
  page.evaluate((c) => {
    const d = document.createElement("div");
    d.style.color = c;
    document.body.append(d);
    const v = getComputedStyle(d).color;
    d.remove();
    return v;
  }, css);

/** Whether the local Anima build exists (scripts/build-anima.ts). CI on the public repo has none. */
import { existsSync } from "node:fs";
export const HAS_ANIMA = existsSync(new URL("../.anima/anima.js", import.meta.url));
export const NEEDS_ANIMA = "needs .anima/ (bun run build:anima with an Anima checkout)";

export const THEMES = ["dark", "light", "rose", "rose-dark", "flexoki", "flexoki-dark"] as const;
export const THEME_LABELS = ["Light", "Rose", "Rose dark", "Flexoki", "Flexoki dark", "Dark"] as const;

/** Pages never scroll sideways: the document is no wider than the viewport. */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll).toBeLessThanOrEqual(client);
}

/** The Anima drawings add nothing to the accessibility tree and take no focus or input. */
export async function expectDecorativeOnly(page: Page) {
  await expect(page.locator("anima-icon:not([aria-hidden='true'])")).toHaveCount(0);
  await expect(page.locator(".golem-anima:not([aria-hidden='true'])")).toHaveCount(0);
  const bad = await page.locator(".golem-anima").evaluateAll((els) =>
    els.filter((e) => getComputedStyle(e).pointerEvents !== "none" || e.querySelector("[tabindex]")).length);
  expect(bad).toBe(0);
}

/**
 * Pauses the Anima part inside `wrapper` and steps it by hand, for deterministic frames.
 * Returns step(dt): advance dt seconds and redraw.
 */
export async function pauseParts(page: Page, wrapperSelector: string) {
  await page.locator(wrapperSelector).evaluateAll((ws) => {
    for (const w of ws) (w.querySelector("anima-icon") as (HTMLElement & { pause(): void }) | null)?.pause();
  });
  return (dt: number) => page.locator(wrapperSelector).evaluateAll((ws, d) => {
    for (const w of ws) {
      const icon = w.querySelector("anima-icon") as (HTMLElement & { player?: { step(d: number): void }; invalidate(): void }) | null;
      icon?.player?.step(d);
      icon?.invalidate();
    }
  }, dt);
}
