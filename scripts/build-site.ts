// Builds the playground (demo/play.html) as a static site into release/site/ (gitignored): the page
// at /, the Anima runtime and scenes from .anima/ at /anima/. Any static host can serve it.
//   bun scripts/build-site.ts [--allow-unpinned]
// Needs `bun run build:tokens` and `bun run build:anima` (from the pinned Anima) first.
import { cpSync, existsSync, readFileSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const out = join(root, "release/site");
const anima = join(root, ".anima");
const fail = (m: string): never => { console.error(m); process.exit(1); };

if (!existsSync(join(anima, "build.json"))) fail("No Anima build: run bun run build:anima.");
const build = JSON.parse(readFileSync(join(anima, "build.json"), "utf8"));
const pin: string = JSON.parse(readFileSync(join(root, "anima-pin.json"), "utf8")).commit;
if (!pin.startsWith(build.anima.commit) && !process.argv.includes("--allow-unpinned"))
  fail(`.anima/ was built from Anima ${build.anima.commit}, anima-pin.json pins ${pin.slice(0, 8)}.`);

rmSync(out, { recursive: true, force: true });
const result = await Bun.build({ entrypoints: [join(root, "demo/play.html")], outdir: out, minify: true, target: "browser",
  define: { "process.env.NODE_ENV": JSON.stringify("production") } });
if (!result.success) fail(result.logs.join("\n"));
renameSync(join(out, "play.html"), join(out, "index.html"));
cpSync(join(anima, "anima.js"), join(out, "anima/anima.js"));
cpSync(join(anima, "scenes"), join(out, "anima/scenes"), { recursive: true });
cpSync(join(build.anima.dir, "LICENSE"), join(out, "anima/LICENSE"));
const files = result.outputs.map((o) => o.path.slice(out.length + 1));
console.log(`release/site: index.html, ${files.filter((f) => !f.endsWith(".html")).join(", ")}, anima/ (Anima ${build.anima.commit})`);
