// @bedrock/ui swaps Onyx's components for Golem's by name (docs/design.md §7). Every component or
// hook Golem exports must therefore exist in Onyx under the same name; the ones Golem wraps are
// type-checked as drop-in replacements in onyx-compat.types.ts.
import { expect, test } from "bun:test";
import * as G from "../src";
import * as O from "@mroiban/onyx";

const GOLEM_ONLY = ["GolemProvider", "useGolem", "configureAnima"];

test("every Golem component and hook has an Onyx namesake", () => {
  const ui = Object.keys(G).filter((k) => /^[A-Z]|^use/.test(k) && !GOLEM_ONLY.includes(k));
  expect(ui.filter((k) => !(k in O))).toEqual([]);
});

test("wrapped components are the ones type-checked as drop-ins", async () => {
  const checked = Object.keys(await import("./onyx-compat.types")).sort();
  const wrapped = Object.keys(G).filter((k) => k in O && (G as Record<string, unknown>)[k] !== (O as Record<string, unknown>)[k]).sort();
  expect(wrapped).toEqual(checked);
});
