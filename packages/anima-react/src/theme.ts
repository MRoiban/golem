// Theme bridge. Two paths, both fed by @golem/tokens:
//  1. Colour slots (the default, zero script): the generated anima-slots.css sets
//     --anima-<token>: var(--onyx-…) on every <anima-icon>; scenes that declare
//     <color name="<token>"> follow the page theme live, also off screen.
//  2. The Theme data model, for scenes that import golem-theme.animl and bind $theme:<token>
//     (needed where colours animate or mix, which slots cannot do). writeThemeData copies the
//     icon's resolved CSS values into the model: colours from --anima-<token>, numbers (shadow,
//     radius) from --golem-anima-<token>, both generated per theme by @golem/tokens.
import { ANIMA_COLORS, ANIMA_NUMBERS, animaNumberVar } from "@golem/tokens/anima";
import { cssColorToRgba } from "./color";
import type { AnimaIconElement } from "./types";

/** Writes every Theme model value; returns false when the scene has no data model. */
export function writeThemeData(icon: AnimaIconElement, motion: boolean): boolean {
  const data = icon.data;
  if (!data) return false;
  const style = getComputedStyle(icon);
  try {
    data.batch(() => {
      for (const k of ANIMA_COLORS) {
        const rgba = cssColorToRgba(style.getPropertyValue(`--anima-${k}`));
        if (rgba) data.color(`$theme:${k}`).set(rgba);
      }
      for (const k of ANIMA_NUMBERS) {
        const n = parseFloat(style.getPropertyValue(animaNumberVar(k)));
        if (Number.isFinite(n)) data.number(`$theme:${k}`).set(n);
      }
      data.number("$theme:motion").set(motion ? 1 : 0);
    });
    return true;
  } catch {
    return false; // the scene does not import the Theme model
  }
}

/** Calls `f` when the document's theme attributes or inline variables change. */
export function onDocumentThemeChange(f: () => void): () => void {
  if (typeof MutationObserver === "undefined") return () => {};
  const mo = new MutationObserver(f);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });
  return () => mo.disconnect();
}
