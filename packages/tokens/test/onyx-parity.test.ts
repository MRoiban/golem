// Golem's light and dark themes must produce exactly the variables and values Onyx 0.2.2 ships,
// so pages on Onyx or @bedrock/ui can switch to Golem's CSS without a visible change.
import { describe, expect, test } from "bun:test";
import * as Onyx from "@mroiban/onyx";
import { onyxCss, onyxVariableNames, resolve } from "../src/generate";

type Table = Record<string, string>;
const onyxTables = (theme: "dark" | "light"): Table => ({
  ...(Onyx.ONYX_PALETTE as Table),
  ...((theme === "dark" ? Onyx.ONYX_SEMANTIC_DARK : Onyx.ONYX_SEMANTIC_LIGHT) as Table),
  ...(Onyx.ONYX_COMPONENT_TOKENS as Table),
  ...(Onyx.ONYX_DENSITY_COMPACT as Table),
});
function onyxResolve(table: Table, name: string): string {
  const v = table[name];
  if (v === undefined) throw new Error(`Onyx has no ${name}`);
  return v.replace(/var\((--onyx-[a-z0-9-]+)\)/g, (_, n: string) => onyxResolve(table, n));
}
const norm = (v: string) => v.toLowerCase().replace(/\s+/g, "").replace(/(^|[,(])0\./g, "$1.");
const golemName = (cssVar: string) => cssVar.replace(/^--onyx-/, "").replace(/^palette-/, "palette.");

describe.each(["dark", "light"] as const)("Onyx parity, %s", (theme) => {
  const table = onyxTables(theme);
  test("Golem emits every Onyx variable", () => {
    const ours = new Set(onyxVariableNames());
    const missing = Object.keys(table).filter((k) => !ours.has(k));
    expect(missing).toEqual([]);
  });
  test("every value resolves to Onyx's value", () => {
    const wrong = Object.keys(table)
      .map((k) => ({ k, onyx: norm(onyxResolve(table, k)), golem: norm(resolve(theme, golemName(k))) }))
      .filter((r) => r.onyx !== r.golem);
    expect(wrong).toEqual([]);
  });
});

test("the generated CSS declares every variable", () => {
  const css = onyxCss();
  const missing = onyxVariableNames().filter((n) => !css.includes(`${n}:`));
  expect(missing).toEqual([]);
});
