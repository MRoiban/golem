import { test, expect } from "@playwright/test";
import { disclosureBasics, value, visibleFocus } from "./disclosure-helpers";
import { HAS_ANIMA, NEEDS_ANIMA, settled, expectDecorativeOnly } from "./helpers";
disclosureBasics("toast");
for (const motion of ["anima", "css"]) test(`Onyx live regions, keyboard, dismiss and timing (${motion})`, async ({ page }) => {
  test.skip(motion === "anima" && !HAS_ANIMA, NEEDS_ANIMA);
  await page.goto(`/?c=toast&motion=${motion}`); await settled(page, motion === "anima");
  const region = page.getByRole("region", { name: "Demo notifications" });
  await expect(region).toBeVisible();
  await expect(page.locator(".onyx-toast-live[aria-live='polite']")).toHaveCount(1);
  await expect(page.locator(".onyx-toast-live[aria-live='assertive']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Unavailable action" })).toBeDisabled();
  const close = region.getByRole("button", { name: "Dismiss notification" });
  await visibleFocus(close, page); await page.keyboard.press("Space"); await expect(region.locator("[data-toast-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Raise danger", exact: true }).click();
  await expect(page.locator(".onyx-toast-live[aria-live='polite']")).toContainText("danger notification");
  await region.getByRole("button", { name: "Dismiss notification" }).focus(); await page.keyboard.press("Escape");
  await expect(region.locator("[data-toast-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Raise timed", exact: true }).click();
  await expect(region.locator("[data-toast-id]")).toHaveCount(1);
  // Hover pauses Onyx's timer; leaving resumes it.
  await region.hover(); await page.waitForTimeout(1450); await expect(region.locator("[data-toast-id]")).toHaveCount(1);
  await page.getByRole("heading", { name: "Toast", exact: true }).hover();
  await expect(region.locator("[data-toast-id]")).toHaveCount(0, { timeout: 6000 });
  await expectDecorativeOnly(page);
});
test("all tone drawings, updates keep the same icon, and icon pointer gestures reach Onyx", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=toast&motion=anima"); await settled(page, true);
  const region = page.getByRole("region", { name: "Demo notifications" });
  // Freeze new drawings as soon as React marks them ready, before their first animation tick.
  await page.evaluate(() => {
    const observer = new MutationObserver(records => {
      for (const record of records) {
        const el = record.target as HTMLElement;
        if (el.matches("[data-golem-part='toast'][data-anima='ready']")) (el.querySelector("anima-icon") as any)?.pause();
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-anima"] });
  });
  for (const tone of ["success", "danger", "warning", "info"]) {
    await page.getByRole("button", { name: "Dismiss all" }).click();
    await page.getByRole("button", { name: `Raise ${tone}`, exact: true }).click();
    const part = region.locator("[data-golem-part]"); await expect(part).toHaveAttribute("data-anima", "ready");
    await part.locator("anima-icon").evaluate(el => { const icon = el as any; icon.player.step(0); icon.player.step(0.08); icon.invalidate(); });
    const trim = await value(part, `${tone}-mark.stroke.trimEnd`);
    expect(trim).toBeGreaterThan(0); expect(trim).toBeLessThan(1);
    await part.locator("anima-icon").evaluate(el => { const icon = el as any; icon.player.step(0.2); icon.invalidate(); });
    expect(await value(part, `${tone}-mark.stroke.trimEnd`)).toBe(1);
    expect(await value(part, `${tone}.opacity`)).toBe(1);
    const handle = await part.locator("anima-icon").elementHandle();
    await page.getByRole("button", { name: "Update latest" }).click();
    await part.locator("anima-icon").evaluate(el => { const icon = el as any; icon.player.step(0); icon.invalidate(); });
    expect(await value(part, `${tone === "success" ? "info" : "success"}.opacity`)).toBe(1);
    expect(await value(part, `${tone}-mark.stroke.trimEnd`)).toBe(1);
    expect(await handle!.evaluate(el => el.isConnected)).toBe(true);
    const geometry = await part.evaluate(el => {
      const a = el.getBoundingClientRect(), b = el.parentElement!.getBoundingClientRect();
      return [a.x-b.x, a.y-b.y, a.width-b.width, a.height-b.height];
    });
    for (const n of geometry) expect(n).toBeCloseTo(0, 1);
    const box = await part.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2); await page.mouse.down(); await page.mouse.move(box!.x + 85, box!.y + 5); await page.mouse.up();
    await expect(region.locator("[data-toast-id]")).toHaveCount(0);
  }
});

test("stacked toast drawings stay hidden with Onyx's background contents", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=toast&motion=anima"); await settled(page, true);
  await page.getByRole("button", { name: "Raise success", exact: true }).click();
  const region = page.getByRole("region", { name: "Demo notifications" });
  const background = region.locator("[data-background]");
  await expect(background).toHaveAttribute("aria-hidden", "true");
  await expect(background.locator(".golem-tone-icon__motion")).toBeHidden();
  await region.hover();
  await expect(region.locator("[data-background]")).toHaveCount(0);
  await expect(region.locator(".golem-tone-icon__motion").first()).toBeVisible();
});
