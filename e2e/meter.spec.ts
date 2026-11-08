import { test, expect } from "@playwright/test";
import { commonTests, values } from "./actions-tests";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
commonTests("meter");
test("DOM values mount at rest, ease continuously, and accept pointer and keyboard updates", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=meter&motion=anima"); await settled(page, true);
  expect((await values(page, "controlled"))["fill.scaleX"]).toBeCloseTo(.2, 3);
  expect((await values(page, "custom"))["fill.scaleX"]).toBeCloseTo(2 / 3, 3);
  await page.getByRole("button", { name: "Change meter" }).click();
  await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBeCloseTo(.9, 3);
  const range = page.locator("input[type=range]"); await range.focus(); await page.keyboard.press("Home");
  await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBe(0);
  await page.keyboard.press("End"); await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBe(1);
  // A direct DOM update proves the drawing reads Onyx's ARIA, rather than the React value prop.
  await page.getByTestId("controlled").getByRole("meter").evaluate(e => e.setAttribute("aria-valuenow", "55"));
  await expect.poll(async () => (await values(page, "controlled"))["fill.scaleX"]).toBeCloseTo(.55, 3);
  const track = page.getByTestId("controlled").locator("[data-slot=meter-track]");
  const sizes = await track.evaluate(e => [e.getBoundingClientRect(), e.querySelector(".golem-anima")!.getBoundingClientRect()].map(r => `${r.width.toFixed(1)}x${r.height.toFixed(1)}`));
  expect(sizes[0]).toBe(sizes[1]);
  expect(await page.getByTestId("controlled").locator("[data-slot=meter-indicator]").evaluate(e => getComputedStyle(e).visibility)).toBe("hidden");
  const step = await pauseParts(page, ".golem-meter");
  const idleX = (await values(page, "controlled"))["sweep.x"];
  await step(.3); expect((await values(page, "controlled"))["sweep.x"]).toBe(idleX);
});
test("tone thresholds come from Onyx, including changes and explicit tones", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=meter&motion=anima"); await settled(page, true);
  for (const [id, tone] of [["value-20", "success"], ["value-60", "warning"], ["value-90", "danger"], ["custom", "info"], ["neutral", "neutral"]]) {
    await expect(page.getByTestId(id!)).toHaveAttribute("data-tone", tone!);
    expect((await values(page, id!))[`${tone}fill.opacity`]).toBe(1);
  }
  await page.getByRole("button", { name: "Change meter" }).click();
  await expect(page.getByTestId("controlled")).toHaveAttribute("data-tone", "danger");
  await expect.poll(async () => (await values(page, "controlled"))["dangerfill.opacity"]).toBe(1);
  expect((await values(page, "controlled"))["successfill.opacity"]).toBe(0);
});

test("numeric easing is interruptible and settles at the new target", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.clock.install();
  await page.goto("/?c=meter&motion=anima"); await settled(page, true); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const track = page.getByTestId("controlled").getByRole("meter");
  // Yield between virtual frames so React commits and the Anima input effect run as in a browser.
  const advance = async (ms: number) => { for (let t = 0; t < ms; t += 16) await page.clock.runFor(16); };
  const set = async (value: number) => { await track.evaluate((e, v) => e.setAttribute("aria-valuenow", String(v)), value); await page.clock.runFor(1); };
  const start = (await values(page, "controlled"))["fill.scaleX"]!;
  await set(90); await advance(64);
  const mid = (await values(page, "controlled"))["fill.scaleX"]!;
  expect(mid).toBeGreaterThan(start); expect(mid).toBeLessThan(.9);
  await set(0); await advance(64);
  expect((await values(page, "controlled"))["fill.scaleX"]!).toBeLessThan(mid);
  await advance(320); expect((await values(page, "controlled"))["fill.scaleX"]).toBe(0);
});
