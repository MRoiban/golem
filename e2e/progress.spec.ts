import { test, expect } from "@playwright/test";
import { commonTests, values } from "./actions-tests";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
commonTests("progress");
test("DOM values mount at rest, ease continuously, and accept pointer and keyboard updates", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=progress&motion=anima"); await settled(page, true);
  expect((await values(page, "controlled"))["fill.scaleX"]).toBeCloseTo(.35, 3);
  expect((await values(page, "custom"))["fill.scaleX"]).toBeCloseTo(2 / 3, 3);
  await page.getByRole("button", { name: "Change progress" }).click();
  await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBeCloseTo(.85, 3);
  const range = page.locator("input[type=range]"); await range.focus(); await page.keyboard.press("Home");
  await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBe(0);
  await page.keyboard.press("End"); await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBe(1);
  // A direct DOM update proves the drawing reads Onyx's ARIA, rather than the React value prop.
  await page.getByTestId("controlled").evaluate(e => e.setAttribute("aria-valuenow", "55"));
  await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBeCloseTo(.55, 3);
  const track = page.getByTestId("controlled");
  const sizes = await track.evaluate(e => [e.getBoundingClientRect(), e.querySelector(".golem-anima")!.getBoundingClientRect()].map(r => `${r.width.toFixed(1)}x${r.height.toFixed(1)}`));
  expect(sizes[0]).toBe(sizes[1]);
  expect(await page.getByTestId("controlled").locator("[data-slot=progress-indicator]").evaluate(e => getComputedStyle(e).visibility)).toBe("hidden");
  const step = await pauseParts(page, ".golem-progress");
  const idleX = (await values(page, "controlled"))["sweep.x"];
  await step(.3); expect((await values(page, "controlled"))["sweep.x"]).toBe(idleX);
});
test("indeterminate sweeps without a numeric ARIA value", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=progress&motion=anima"); await settled(page, true);
  await expect(page.getByTestId("indeterminate")).not.toHaveAttribute("aria-valuenow");
  expect((await values(page, "indeterminate"))["sweep.opacity"]).toBe(1);
  expect((await values(page, "indeterminate"))["fill.opacity"]).toBe(0);
  const x = (await values(page, "indeterminate"))["sweep.x"];
  await expect.poll(async () => (await values(page, "indeterminate"))["sweep.x"]).not.toBe(x);
});

test("numeric easing is interruptible and settles at the new target", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.clock.install();
  await page.goto("/?c=progress&motion=anima"); await settled(page, true); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const track = page.getByTestId("controlled");
  // Yield between virtual frames so React commits and the Anima input effect run as in a browser.
  const advance = async (ms: number) => { for (let t = 0; t < ms; t += 16) await page.clock.runFor(16); };
  const set = async (value: number) => { await track.evaluate((e, v) => e.setAttribute("aria-valuenow", String(v)), value); await page.clock.runFor(1); };
  const start = (await values(page, "controlled"))["fill.scaleX"]!;
  await set(90); await advance(64);
  const mid = (await values(page, "controlled"))["fill.scaleX"]!;
  expect(mid).toBeGreaterThan(start); expect(mid).toBeLessThan(.9);
  // Retarget mid-flight; check the reversal after half the duration (see meter.spec.ts).
  await set(0); await advance(128);
  expect((await values(page, "controlled"))["fill.scaleX"]!).toBeLessThan(mid);
  await advance(256); expect((await values(page, "controlled"))["fill.scaleX"]).toBe(0);
});
