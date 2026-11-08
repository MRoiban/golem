import { expect, test, type Locator, type Page } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA } from "./helpers";

export async function drawingBox(part: Locator) {
  return part.evaluate((el) => {
    const icon = el.querySelector("anima-icon")!;
    const rects = [...icon.shadowRoot!.querySelectorAll("rect")];
    const rect = rects.find((r) => {
      let node: Element | null = r;
      while (node && node.tagName !== "svg") {
        if (getComputedStyle(node).opacity === "0") return false;
        node = node.parentElement;
      }
      return true;
    })!;
    const b = rect.getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
}
export async function expectAligned(
  part: Locator,
  item: Locator,
  line = false,
) {
  await expect
    .poll(async () => {
      const a = await drawingBox(part),
        b = (await item.boundingBox())!;
      return Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.width - b.width),
        Math.abs(a.y - (line ? b.y + b.height - a.height : b.y)),
        line ? 0 : Math.abs(a.height - b.height),
      );
    })
    .toBeLessThan(1);
}
export async function iconFill(part: Locator, slot: string) {
  return part.evaluate(
    (el, name) =>
      getComputedStyle(
        el
          .querySelector("anima-icon")!
          .shadowRoot!.querySelector(`[fill*="--anima-${name},"]`)!,
      ).fill,
    slot,
  );
}
export async function go(page: Page, component: string, q = "motion=anima") {
  // Keep plain-Onyx e2e usable without a local Anima checkout, like the Switch suite.
  test.skip(
    q.includes("motion=anima") && !q.includes("anima=off") && !HAS_ANIMA,
    NEEDS_ANIMA,
  );
  await page.goto(`/?c=${component}&many=0&${q}`);
}
