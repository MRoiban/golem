// Golem's size report: what Golem adds on top of React + Onyx, and the Anima runtime it loads.
// All sizes min + gzip -9. Budgets are Golem's own (docs/design.md "Size budgets"); Anima's gates are
// checked against the runtime Golem builds.  bun scripts/sizes.ts [--json]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { animaSlotsCss, onyxCss } from "../packages/golem/src/tokens/generate";

const root = join(import.meta.dir, "..");
const KB = 1024;
const gz = (s: string | Uint8Array) => gzipSync(s, { level: 9 }).length;

async function bundle(entry: string, external: string[]): Promise<string> {
  const r = await Bun.build({ entrypoints: [join(root, entry)], minify: true, target: "browser", format: "esm", external });
  if (!r.success) throw new Error(r.logs.join("\n"));
  return (await r.outputs[0]!.text());
}

const ext = ["react", "react-dom", "react/jsx-runtime", "@mroiban/onyx"];
const pkg = "packages/golem/src";
const bridge = await bundle(`${pkg}/anima/index.ts`, ext);
const main = await bundle(`${pkg}/index.ts`, ext); // Switch + the bridge it uses
const css = readFileSync(join(root, pkg, "components/styles.css"), "utf8");

type Row = { what: string; bytes: number; gz: number; budget?: number; note?: string };
const rows: Row[] = [
  { what: "@mroiban/golem/anima (bridge, JS)", bytes: bridge.length, gz: gz(bridge), budget: 4 * KB },
  { what: "@mroiban/golem (Switch + bridge, JS)", bytes: main.length, gz: gz(main), budget: 6 * KB },
  { what: "@mroiban/golem/styles.css", bytes: css.length, gz: gz(css), budget: 1 * KB },
  { what: "@mroiban/golem/tokens.css (6 themes)", bytes: onyxCss().length, gz: gz(onyxCss()), budget: 6 * KB, note: "replaces Onyx's own token blocks when used" },
  { what: "@mroiban/golem/anima-slots.css", bytes: animaSlotsCss().length, gz: gz(animaSlotsCss()), budget: 1 * KB },
];
const build = join(root, ".anima/build.json");
if (existsSync(build)) {
  const info = JSON.parse(readFileSync(build, "utf8"));
  for (const s of info.scenes) rows.push({ what: `scene ${s.name}.ani`, bytes: s.bytes, gz: s.gz, budget: 64 * KB, note: "Anima gate: each scene ≤ 64 KB (scene file only here)" });
  rows.push({ what: `Anima runtime (core + web${info.runtime.modules.length ? " + " + info.runtime.modules.join(", ") : ""}) @ ${info.anima.commit}`,
    bytes: info.runtime.bytes, gz: info.runtime.gz, budget: 24 * KB, note: "Anima gate: core + web ≤ 24 KB" });
  const golem = rows[1]!.gz + rows[2]!.gz + rows[4]!.gz;
  const scenes = info.scenes.reduce((a: number, s: { gz: number }) => a + s.gz, 0);
  rows.push({ what: "app-UI total: Golem JS+CSS + runtime + scenes", bytes: 0, gz: golem + info.runtime.gz + scenes, budget: 128 * KB, note: "Anima gate: app-UI ≤ 128 KB" });
} else rows.push({ what: "Anima runtime", bytes: 0, gz: 0, note: "not built (no .anima/; run bun run build:anima)" });

if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
else {
  const f = (n: number) => (n ? `${(n / KB).toFixed(2)} KB` : "—");
  console.log("| What | min | min+gz | budget | |\n| --- | ---: | ---: | ---: | --- |");
  for (const r of rows) console.log(`| ${r.what} | ${f(r.bytes)} | ${f(r.gz)} | ${r.budget ? f(r.budget) : ""} | ${r.budget ? (r.gz <= r.budget ? "ok" : "**over**") : ""}${r.note ? " " + r.note : ""} |`);
}
if (rows.some((r) => r.budget && r.gz > r.budget)) process.exitCode = 1;
