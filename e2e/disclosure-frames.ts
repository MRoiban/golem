import { test, expect } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, settled } from "./helpers";

export function disclosureFrames(name: "collapsible" | "accordion" | "alert" | "toast") {
  test.skip(!process.env.SHOTS, "set SHOTS=1 to write frames");
  test.use({ deviceScaleFactor: 6 });
  test(`${name}: deterministic motion frames and Onyx reference`, async ({ page }) => {
    test.skip(!HAS_ANIMA, NEEDS_ANIMA);
    await page.goto(`/?c=${name}&motion=anima&theme=light`); await settled(page, true);
    const chevron = name === "collapsible" || name === "accordion";
    const part = chevron ? page.getByTestId(name === "collapsible" ? "basic" : "history")
      : name === "alert" ? page.getByTestId("success").locator("[data-golem-part]")
      : page.locator(".golem-toast-viewport [data-golem-part]");
    const crop = chevron ? part : name === "alert" ? page.getByTestId("success") : page.locator(".golem-toast-viewport [data-toast-id]");
    await part.evaluate(el => (el.querySelector("anima-icon") as any).pause());
    if (chevron) await part.click();
    else await part.evaluate(el => { const icon = el.querySelector("anima-icon") as any; icon.player.step(0); icon.player.step(1); icon.fire("draw"); });
    await page.waitForTimeout(50); // let React write DOM-derived inputs; the paused clock cannot run
    let previous = 0;
    for (const at of [0, 0.04, 0.08, 0.12, 0.2, 0.24]) {
      const values = await part.evaluate((el, dt) => {
        const icon = el.querySelector("anima-icon") as any;
        icon.player.step(dt); icon.invalidate(); return icon.values();
      }, at - previous);
      if (at === 0.08) {
        const v = values[chevron ? "chevron.rotate" : `${name === "alert" ? "success" : "info"}-mark.stroke.trimEnd`];
        expect(v).toBeGreaterThan(chevron ? -90 : 0); expect(v).toBeLessThan(chevron ? 5 : 1);
      }
      previous = at;
      await crop.screenshot({ path: `docs/screenshots/${name}/frames-${Math.round(at*1000).toString().padStart(3, "0")}ms.png`, animations: "allow" });
    }
    if (name === "toast") {
      for (const tone of ["success", "warning", "danger"]) {
        await page.getByRole("button", { name: "Dismiss all" }).click();
        await page.getByRole("button", { name: `Raise ${tone}`, exact: true }).click();
        await expect(part).toHaveAttribute("data-anima", "ready");
        await part.evaluate(el => { const icon = el.querySelector("anima-icon") as any; icon.pause(); icon.player.step(0); icon.player.step(1); icon.fire("draw"); icon.player.step(0); icon.player.step(0.08); icon.invalidate(); });
        await crop.screenshot({ path: `docs/screenshots/${name}/frames-${tone}-080ms.png`, animations: "allow" });
        await part.evaluate(el => { const icon = el.querySelector("anima-icon") as any; icon.player.step(0.16); icon.invalidate(); });
        await crop.screenshot({ path: `docs/screenshots/${name}/frames-${tone}-240ms.png`, animations: "allow" });
      }
    }
    await page.getByTestId("plain").screenshot({ path: `docs/screenshots/${name}/frames-onyx-reference.png` });
  });
}
