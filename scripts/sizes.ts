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
const main = await bundle(`${pkg}/index.ts`, ext); // every component + the bridge
// styles.css @imports each component's CSS: measure it flattened and minified, as shipped.
const cssBuild = await Bun.build({ entrypoints: [join(root, pkg, "components/styles.css")], minify: true });
if (!cssBuild.success) throw new Error(cssBuild.logs.join("\n"));
const css = await cssBuild.outputs[0]!.text();

type Row = { what: string; bytes: number; gz: number; budget?: number; note?: string };
const rows: Row[] = [
  { what: "@mroiban/golem/anima (bridge, JS)", bytes: bridge.length, gz: gz(bridge), budget: 4 * KB },
  { what: "@mroiban/golem (all components + bridge, JS)", bytes: main.length, gz: gz(main), budget: 20 * KB },
  { what: "@mroiban/golem/styles.css (all components)", bytes: css.length, gz: gz(css), budget: 4 * KB },
  { what: "@mroiban/golem/tokens.css (6 themes)", bytes: onyxCss().length, gz: gz(onyxCss()), budget: 6 * KB, note: "replaces Onyx's own token blocks when used" },
  { what: "@mroiban/golem/anima-slots.css", bytes: animaSlotsCss().length, gz: gz(animaSlotsCss()), budget: 1 * KB },
];
const build = join(root, ".anima/build.json");
if (existsSync(build)) {
  const info = JSON.parse(readFileSync(build, "utf8"));
  for (const s of info.scenes) rows.push({ what: `scene ${s.name}.ani`, bytes: s.bytes, gz: s.gz, budget: 4 * KB, note: "Golem: each scene ≤ 4 KB (Anima gate 64 KB)" });
  rows.push({ what: `Anima runtime (core + web${info.runtime.modules.length ? " + " + info.runtime.modules.join(", ") : ""}) @ ${info.anima.commit}`,
    bytes: info.runtime.bytes, gz: info.runtime.gz, budget: info.runtime.modules.length ? 32 * KB : 24 * KB,
    note: info.runtime.modules.length ? "Golem: core + web + modules ≤ 32 KB (Anima gate: core + web ≤ 24 KB)" : "Anima gate: core + web ≤ 24 KB" });
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
