import { test, expect } from "@playwright/test";
import { commonTests, values } from "./actions-tests";
import { HAS_ANIMA, NEEDS_ANIMA, settled, pauseParts } from "./helpers";
commonTests("spinner");
test("sizes match Onyx; arc rotates by half a turn in 350ms without adding a target", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA); await page.goto("/?c=spinner&motion=anima"); await settled(page, true);
  for (const size of ["xs", "sm", "md", "lg"]) {
    const box = (id: string) => page.getByTestId(id).evaluate(e => [(e as HTMLElement).offsetWidth, (e as HTMLElement).offsetHeight]);
    expect(await box(`spinner-${size}`)).toEqual(await box(`plain-${size}`));
    const b = page.getByTestId(`spinner-${size}`);
    expect(await b.evaluate(e => getComputedStyle(e).borderTopColor)).toBe("rgba(0, 0, 0, 0)");
  }
  const step = await pauseParts(page, ".golem-spinner"); const before = (await values(page, "spinner-md"))["turn.rotate"];
  await step(.35); const after = (await values(page, "spinner-md"))["turn.rotate"];
  expect((after! - before! + 360) % 360).toBeCloseTo(180, 0);
  // An informational status has no activation; the host cannot intercept pointer events.
  expect(await page.getByTestId("spinner-md").locator(".golem-anima").evaluate(e => getComputedStyle(e).pointerEvents)).toBe("none");
});
