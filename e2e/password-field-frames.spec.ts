import { test } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, pauseParts, settled } from "./helpers";
test.skip(!process.env.SHOTS, "set SHOTS=1 to write screenshots");
test.use({ deviceScaleFactor: 6 });
test("eye closes and reopens", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  await page.goto("/?c=password-field&motion=anima");
  await settled(page, true);
  const input = page.getByTestId("filled"), wrapper = input.locator("xpath=../..");
  const step = await pauseParts(page, ".golem-password-field");
  const button = wrapper.getByRole("button");
  for (const direction of ["close", "open"]) {
    await button.click();
    await page.waitForTimeout(50); // Inputs queue while playback is paused.
    await step(0);
    let t = 0;
    for (const at of [0, 0.04, 0.08, 0.12, 0.2]) {
      await step(at - t); t = at;
      await button.screenshot({ path: `docs/screenshots/password-field/frames-${direction}-${Math.round(at * 1000)}ms.png` });
    }
  }
  // Onyx's own glyphs, for comparison with the drawing at rest (open) and revealed (closed).
  const plain = page.getByTestId("plain").locator("xpath=..").getByRole("button");
  await plain.screenshot({ path: "docs/screenshots/password-field/frames-plain.png" });
  await plain.click();
  await plain.screenshot({ path: "docs/screenshots/password-field/frames-plain-closed.png" });
});
