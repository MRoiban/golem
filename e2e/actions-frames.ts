import type { Page } from "@playwright/test";
/** Reset the paused debug player to a known phase, preserving inputs from the Onyx DOM.
 * The host has no public settle/reset API (F3); this is test-only deterministic stepping. */
export async function resetActionParts(page: Page, name: string) {
  await page.locator(`.golem-${name}`).evaluateAll((wrappers, name) => {
    type Player = { model: object; step(dt: number): void };
    for (const w of wrappers) {
      const icon = w.querySelector("anima-icon") as HTMLElement & { player: Player; set(k: string, v: number | boolean): void; invalidate(): void };
      const Constructor = icon.player.constructor as new (model: object) => Player;
      icon.player = new Constructor(icon.player.model);
      if (name === "button") {
        icon.set("busy", w.hasAttribute("data-loading") && !w.hasAttribute("data-result"));
        icon.set("success", w.getAttribute("data-result") === "success"); icon.set("error", w.getAttribute("data-result") === "error");
      } else if (name === "spinner") {
        const size = w.querySelector("[data-slot=spinner]")!.getAttribute("data-size");
        for (const s of ["xs", "sm", "lg"]) icon.set(s, size === s);
      } else {
        const root = w.querySelector(`[data-slot=${name}]`)!;
        const track = root.querySelector("[data-slot=meter-track]") ?? root;
        const min = Number(track.getAttribute("aria-valuemin")), max = Number(track.getAttribute("aria-valuemax"));
        icon.set("level", (Number(track.getAttribute("aria-valuenow")) - min) / (max - min));
        icon.set("indeterminate", !track.hasAttribute("aria-valuenow"));
        for (const t of ["info", "success", "warning", "danger"]) icon.set(t, root.getAttribute("data-tone") === t);
      }
      icon.player.step(0); icon.player.step(5); icon.invalidate();
    }
  }, name);
}
