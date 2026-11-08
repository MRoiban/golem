import { test, expect } from "@playwright/test";
import { commonTests, values } from "./actions-tests";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
commonTests("button");
test("drawing follows DOM loading, result changes, press and pointer activation", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=button&motion=anima"); await settled(page, true);
  expect((await values(page, "loading"))["spinner.opacity"]).toBe(1);
  expect((await values(page, "result"))["check.opacity"]).toBe(0);
  expect((await values(page, "initial-success"))["check.stroke.trimEnd"]).toBe(1);
  expect((await values(page, "initial-success"))["check.opacity"]).toBe(1);
  expect((await values(page, "initial-error"))["drawing.x"]).toBe(0);
  expect((await values(page, "initial-error"))["cross.opacity"]).toBe(1);
  const b = page.getByTestId("save"), box = await b.boundingBox();
  const width = box!.width;
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2); await page.mouse.down();
  await expect(b.locator("..")).toHaveAttribute("data-down", ""); await page.mouse.up();
  await expect(b).toHaveAttribute("aria-busy", "true");
  expect(await b.evaluate(e => (e as HTMLElement).offsetWidth)).toBe(Math.round(width));
  await expect.poll(async () => (await values(page, "save"))["check.opacity"]).toBe(1);
  await expect(b).toHaveAccessibleName("Save");
  expect(await b.locator("[data-slot=button-label]").evaluate(e => getComputedStyle(e).opacity)).toBe("0");
  await page.getByTestId("save-error").click(); await expect.poll(async () => (await values(page, "save-error"))["cross.opacity"]).toBe(1);
  await page.getByRole("button", { name: "Show success", exact: true }).click();
  await expect.poll(async () => (await values(page, "result"))["check.stroke.trimEnd"]).toBeCloseTo(1);
  await page.getByRole("button", { name: "Clear result", exact: true }).click();
  await expect.poll(async () => (await values(page, "result"))["check.opacity"]).toBe(0);
  // The drawing occupies only the existing spinner slot, away from the still-visible loading label.
  const overlap = await page.getByTestId("loading").evaluate(b => {
    const a = b.querySelector(".golem-button__motion")!.getBoundingClientRect(), l = b.querySelector("[data-slot=button-label]")!.getBoundingClientRect();
    return Math.max(0, Math.min(a.right,l.right)-Math.max(a.left,l.left));
  }); expect(overlap).toBe(0);
  // Repeated result changes retrigger a draw after clearing.
  const step = await pauseParts(page, ".golem-button");
  const idleTurn = (await values(page, "result"))["turn.rotate"];
  await step(.2); expect((await values(page, "result"))["turn.rotate"]).toBe(idleTurn);
  await page.getByRole("button", { name: "Show success", exact: true }).click(); await step(0); await step(.08);
  expect((await values(page, "result"))["check.stroke.trimEnd"]).toBeLessThan(1); await step(.24);
});

test("all variants and sizes keep a foreground spinner away from the label", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=button&motion=anima"); await settled(page, true);
  const buttons = page.locator("[data-testid^=variant-], [data-testid^=size-]");
  const widths = await buttons.evaluateAll(bs => bs.map(b => (b as HTMLElement).offsetWidth));
  await page.getByRole("button", { name: "Toggle samples loading" }).click();
  await expect(page.getByTestId("variant-default")).toHaveAttribute("aria-busy", "true");
  const geometry = await buttons.evaluateAll(bs => bs.map(b => {
    const motion = b.querySelector(".golem-button__motion")!, label = b.querySelector("[data-slot=button-label]")!;
    const a = motion.getBoundingClientRect(), l = label.getBoundingClientRect();
    return { width: (b as HTMLElement).offsetWidth, overlap: Math.max(0, Math.min(a.right, l.right) - Math.max(a.left, l.left)),
      stroke: getComputedStyle(b.querySelector("anima-icon")!.shadowRoot!.querySelector("[stroke='currentColor']")!).stroke, color: getComputedStyle(b).color };
  }));
  geometry.forEach((g, i) => { expect(g.width).toBe(widths[i]); expect(g.overlap).toBeLessThanOrEqual(.6); expect(g.stroke).toBe(g.color); });
  await page.getByRole("button", { name: "Toggle samples loading" }).click();
  await expect(page.getByTestId("variant-default")).not.toHaveAttribute("aria-busy", "true");
});
