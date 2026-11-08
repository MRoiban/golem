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
    const total = await page.locator(".golem-switch").count();
    await expect(page.locator(".golem-switch[data-anima='ready']")).toHaveCount(total, { timeout: 45_000 });
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
