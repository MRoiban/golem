// Golem's size report: what Golem adds on top of React + Onyx, and the Anima runtime it loads.
// All sizes min + gzip -9. Budgets are Golem's own (docs/design.md "Size budgets"); Anima's gates are
// checked against the runtime Golem builds.  bun scripts/sizes.ts [--json]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { animaSlotsCss, onyxCss } from "../packages/tokens/src/generate";

const root = join(import.meta.dir, "..");
const KB = 1024;
const gz = (s: string | Uint8Array) => gzipSync(s, { level: 9 }).length;

async function bundle(entry: string, external: string[]): Promise<string> {
  const r = await Bun.build({ entrypoints: [join(root, entry)], minify: true, target: "browser", format: "esm", external });
  if (!r.success) throw new Error(r.logs.join("\n"));
  return (await r.outputs[0]!.text());
}

const ext = ["react", "react-dom", "react/jsx-runtime", "@mroiban/onyx"];
const bridge = await bundle("packages/anima-react/src/index.ts", [...ext]);
const bridgeAndTokens = bridge; // the bridge imports @golem/tokens' generators (theme data path)
const components = await bundle("packages/components/src/index.ts", [...ext, "@golem/anima-react", "@golem/tokens"]);
const css = readFileSync(join(root, "packages/components/src/styles.css"), "utf8");

type Row = { what: string; bytes: number; gz: number; budget?: number; note?: string };
const rows: Row[] = [
  { what: "@golem/anima-react (bridge, JS)", bytes: bridgeAndTokens.length, gz: gz(bridgeAndTokens), budget: 4 * KB },
  { what: "@golem/components (Switch, JS)", bytes: components.length, gz: gz(components), budget: 2 * KB },
  { what: "@golem/components styles.css", bytes: css.length, gz: gz(css), budget: 1 * KB },
  { what: "@golem/tokens golem.css (4 themes)", bytes: onyxCss().length, gz: gz(onyxCss()), budget: 6 * KB, note: "replaces Onyx's own token blocks when used" },
  { what: "@golem/tokens anima-slots.css", bytes: animaSlotsCss().length, gz: gz(animaSlotsCss()), budget: 1 * KB },
];
const build = join(root, ".anima/build.json");
if (existsSync(build)) {
  const info = JSON.parse(readFileSync(build, "utf8"));
  for (const s of info.scenes) rows.push({ what: `scene ${s.name}.ani`, bytes: s.bytes, gz: s.gz, budget: 64 * KB, note: "Anima gate: each scene ≤ 64 KB (scene file only here)" });
  rows.push({ what: `Anima runtime (core + web${info.runtime.modules.length ? " + " + info.runtime.modules.join(", ") : ""}) @ ${info.anima.commit}`,
    bytes: info.runtime.bytes, gz: info.runtime.gz, budget: 24 * KB, note: "Anima gate: core + web ≤ 24 KB" });
  const golem = rows.slice(0, 3).reduce((a, r) => a + r.gz, 0) + gz(animaSlotsCss());
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
