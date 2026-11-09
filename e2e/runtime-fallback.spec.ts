// When Anima can't be used after all, Golem must show plain Onyx and nothing else. Found on iPhone
// Safari (2026-11-09): a cached older runtime lacked settle(), every mount threw after its drawing
// was in the page, and stale drawings sat over Onyx's paint (doubled thumbs, two tab underlines).
import { expect, test, type Page } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA } from "./helpers";

/** Serves the real runtime with `patch` appended (it runs after <anima-icon> is defined). */
async function patchRuntime(page: Page, patch: string) {
  await page.route("**/anima/anima.js", async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, body: `${await res.text()}\n;(() => { const C = customElements.get("anima-icon"); ${patch} })();` });
  });
}

async function expectPlainOnyx(page: Page) {
  await expect(page.locator("anima-icon")).toHaveCount(0);
  const parts = page.locator("[data-golem-part]");
  expect(await parts.count()).toBeGreaterThan(60);
  await expect.poll(() => parts.evaluateAll((els) => els.filter((e) => e.getAttribute("data-anima") !== "off").length)).toBe(0);
  // Behaviour is Onyx's and the readout follows it.
  await page.getByLabel("Beta features").click();
  await expect(page.getByTestId("state-switch")).toContainText("beta=on");
  await expect(page.getByLabel("Beta features")).toHaveAttribute("aria-checked", "true");
}

test("a runtime too old for this Golem is refused once, with plain Onyx everywhere", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  const warnings: string[] = [];
  page.on("console", (m) => { if (m.type() === "warning") warnings.push(m.text()); });
  await patchRuntime(page, "delete C.prototype.settle;");
  await page.goto("/play?motion=anima");
  await expect(page.getByTestId("runtime")).toHaveText("absent");
  await expectPlainOnyx(page);
  expect(warnings.filter((w) => /lacks settle/.test(w))).toHaveLength(1);
  expect(warnings.filter((w) => /mount failed/.test(w))).toEqual([]);
});

test("a mount that fails partway removes its drawing", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await patchRuntime(page, `C.prototype.settle = function () { throw new Error("settle failed (test)"); };`);
  await page.goto("/play?motion=anima");
  await expect(page.getByTestId("runtime")).toHaveText("ready");
  // Mount everything: parts below the fold mount when scrolled near.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 500) { await page.evaluate((top) => scrollTo(0, top), y); await page.waitForTimeout(60); }
  await page.evaluate(() => scrollTo(0, 0));
  await expectPlainOnyx(page);
});
