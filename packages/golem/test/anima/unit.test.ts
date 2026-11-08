import { expect, test } from "bun:test";
import { parseColor } from "../../src/anima/color";
import { resolveMotion } from "../../src/anima/motion";
import { modelKey } from "../../src/anima/runtime";

test("parseColor", () => {
  expect(parseColor("#205ea6")).toEqual([0x20, 0x5e, 0xa6, 255]);
  expect(parseColor("#FFF")).toEqual([255, 255, 255, 255]);
  expect(parseColor("#10203080")).toEqual([16, 32, 48, 128]);
  expect(parseColor(" rgb(32, 94, 166) ")).toEqual([32, 94, 166, 255]);
  expect(parseColor("rgba(16,15,15,.24)")).toEqual([16, 15, 15, 61]);
  expect(parseColor("rgb(32 94 166 / 50%)")).toEqual([32, 94, 166, 128]);
  expect(parseColor("var(--x)")).toBeNull();
  expect(parseColor("#12345")).toBeNull();
});

test("resolveMotion", () => {
  expect(resolveMotion("system", false)).toBe("anima");
  expect(resolveMotion("system", true)).toBe("reduced");
  expect(resolveMotion("anima", true)).toBe("anima"); // an explicit in-app choice wins
  expect(resolveMotion("css", false)).toBe("css");
});

test("model cache key is (file, component)", () => {
  expect(modelKey("/a.ani")).not.toBe(modelKey("/a.ani", "switch"));
  expect(modelKey("/a.ani", "switch")).toBe(modelKey("/a.ani", "switch"));
});
