// Every token must reach every output, for every theme. A token added to source.ts but missing
// from a generator (or a theme that forgets a key) fails here.
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ANIMA_COLORS, ANIMA_NUMBERS, THEME_NAMES, animaSlotsCss, animaThemeLibrary, animaThemeValues,
  glyphyStyle, onyxCss, outputs, resolve,
} from "../src/generate";
import { animaColors, animaNumbers, base, density, icon, themes } from "../src/source";

/** The declarations inside the CSS block whose selector list contains `selector`. */
function blockVars(css: string, selector: string): Set<string> {
  const names = new Set<string>();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of css.matchAll(re)) {
    const selectors = m[1]!.split(",").map((s) => s.trim());
    if (!selectors.includes(selector)) continue;
    for (const d of m[2]!.matchAll(/(--[a-zA-Z0-9-]+):/g)) names.add(d[1]!);
  }
  return names;
}

describe("Onyx CSS", () => {
  const css = onyxCss();
  const themeKeys = Object.keys(themes.dark.colors);
  test.each(THEME_NAMES)("theme %s declares every theme key in its own block", (t) => {
    const sel = t === "dark" ? "[data-theme='dark']" : `[data-theme='${t}']`;
    const vars = blockVars(css, sel);
    expect(themeKeys.filter((k) => !vars.has(`--onyx-${k}`))).toEqual([]);
    expect(vars.has("--onyx-control-destructive-bg")).toBe(true); // aliases repeated per theme
  });
  test("every theme defines exactly the same keys", () => {
    for (const t of THEME_NAMES) expect(Object.keys(themes[t].colors).sort()).toEqual([...themeKeys].sort());
  });
  test(":root declares every base and compact density token", () => {
    const vars = blockVars(css, ":root");
    const want = [...Object.keys(base), ...Object.keys(density.compact)].map((k) => `--onyx-${k}`);
    expect(want.filter((k) => !vars.has(k))).toEqual([]);
  });
  test("both densities declare the same keys", () => {
    expect(Object.keys(density.comfortable).sort()).toEqual(Object.keys(density.compact).sort());
    const vars = blockVars(css, "[data-density='comfortable']");
    expect(Object.keys(density.comfortable).filter((k) => !vars.has(`--onyx-${k}`))).toEqual([]);
  });
  test("every token resolves in every theme (no dangling references)", () => {
    for (const t of THEME_NAMES)
      for (const k of [...Object.keys(base), ...themeKeys]) expect(() => resolve(t, k)).not.toThrow();
  });
});

describe("Anima outputs", () => {
  test("slot CSS has every Anima colour", () => {
    const css = animaSlotsCss();
    expect(ANIMA_COLORS.filter((k) => !css.includes(`--anima-${k}:`))).toEqual([]);
  });
  test.each(THEME_NAMES)("slot CSS has every Anima number for theme %s", (t) => {
    const vars = blockVars(animaSlotsCss(), t === "dark" ? "[data-theme='dark']" : `[data-theme='${t}']`);
    expect(ANIMA_NUMBERS.filter((k) => !vars.has(`--golem-anima-${k}`))).toEqual([]);
  });
  test("every Anima number has a value for every theme", () => {
    for (const k of ANIMA_NUMBERS) expect(Object.keys(animaNumbers[k]).sort()).toEqual([...THEME_NAMES].sort());
  });
  test("theme library has every Anima colour and number", () => {
    const lib = animaThemeLibrary();
    expect(ANIMA_COLORS.filter((k) => !lib.includes(`<color name="${k}"`))).toEqual([]);
    expect([...ANIMA_NUMBERS, "motion"].filter((k) => !lib.includes(`<number name="${k}"`))).toEqual([]);
  });
  test.each(THEME_NAMES)("theme %s resolves every Anima colour to #rrggbb", (t) => {
    const v = animaThemeValues()[t];
    for (const k of ANIMA_COLORS) expect(v[k]).toMatch(/^#[0-9a-f]{6}$/);
    for (const k of ANIMA_NUMBERS) expect(typeof v[k]).toBe("number");
  });
  test("every Anima colour points at a real token", () => {
    for (const k of ANIMA_COLORS) expect(() => resolve("dark", animaColors[k])).not.toThrow();
  });
});

describe("Glyphy style", () => {
  test("[style] has and locks every icon key", () => {
    const toml = glyphyStyle();
    for (const k of Object.keys(icon)) {
      expect(toml).toMatch(new RegExp(`^${k} = `, "m"));
      expect(toml).toContain(`"${k}"`);
    }
  });
});

test("built dist/ matches the generators (run bun run build:tokens)", () => {
  const dist = join(import.meta.dir, "..", "dist");
  if (!existsSync(dist)) return; // dist is gitignored; CI builds it first
  for (const [file, text] of Object.entries(outputs())) expect(Bun.file(join(dist, file)).text()).resolves.toBe(text);
});
