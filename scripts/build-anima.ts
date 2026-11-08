// Builds everything Golem needs from a local Anima checkout into .anima/ (gitignored):
//   .anima/anima.js          the browser runtime: core + web + the modules Golem's scenes require
//   .anima/scenes/<n>.ani    each packages/*/scenes/<n>.animl compiled by the Anima CLI
//   .anima/build.json        Anima commit, module list and sizes
// Anima is private and still changing, so Golem never commits its runtime or compiled scenes; it
// depends on a checkout by path. Set ANIMA_DIR, or keep anima next to golem (../anima).
//   bun scripts/build-anima.ts [--check]   --check: validate the scenes and theme library only
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { animaThemeLibrary } from "../packages/tokens/src/generate";

const root = resolve(import.meta.dir, "..");
export const ANIMA = resolve(process.env.ANIMA_DIR ?? join(root, "..", "anima"));
if (!existsSync(join(ANIMA, "packages/web/src/index.ts"))) {
  console.error(`No Anima checkout at ${ANIMA}. Set ANIMA_DIR. Golem still works without it (plain Onyx).`);
  process.exit(1);
}
const out = join(root, ".anima");
mkdirSync(join(out, "scenes"), { recursive: true });
const cli = (...args: string[]) =>
  execFileSync("node", [join(ANIMA, "packages/cli/src/main.ts"), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const commit = execFileSync("git", ["-C", ANIMA, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const gz = (s: string) => gzipSync(s, { level: 9 }).length;

// 1. The Anima theme library generated from Golem's tokens must validate in a document that uses it.
const check = join(out, "check");
mkdirSync(join(check, "lib"), { recursive: true });
writeFileSync(join(check, "lib/golem-theme.animl"), animaThemeLibrary());
writeFileSync(join(check, "theme-check.animl"), `<anima version="0.1" name="theme-check" grid="16" viewBox="0 0 16 16" requires="paint bind data">
  <import src="lib/golem-theme.animl" as="t"/>
  <instance name="theme" model="t:Theme" default="true"/>
  <circle id="c" cx="8" cy="8" r="6" fill="#000000"/>
  <bind target="c.fill" value="$theme:buttonBg"/>
  <bind target="c.opacity" value="$theme:shadow + $theme:motion"/>
</anima>
`);
cli("validate", join(check, "theme-check.animl"));
console.log("golem-theme.animl: valid");

// 2. Scenes.
const scenes: { name: string; file: string; bytes: number; gz: number; requires: string[] }[] = [];
for (const pkg of readdirSync(join(root, "packages"))) {
  const dir = join(root, "packages", pkg, "scenes");
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".animl"))) {
    const name = basename(f, ".animl");
    const target = join(out, "scenes", `${name}.ani`);
    cli("build", join(dir, f), "-o", target);
    const text = readFileSync(target, "utf8");
    const requires: string[] = JSON.parse(text).requires ?? [];
    scenes.push({ name, file: `packages/${pkg}/scenes/${f}`, bytes: text.length, gz: gz(text), requires });
    console.log(`${name}.ani: ${text.length} B, ${gz(text)} B gz, requires [${requires.join(" ")}]`);
  }
}
if (process.argv.includes("--check")) process.exit(0);

// 3. Runtime: the base element plus each required module's web entry.
const entries = readdirSync(join(ANIMA, "packages/web/src")).filter((f) => f.endsWith(".ts")).map((f) => basename(f, ".ts"));
const byFeature = new Map(entries.map((e) => [e.replace(/-/g, ""), e]));
const modules = [...new Set(scenes.flatMap((s) => s.requires))].map((r) => {
  const e = byFeature.get(r);
  if (!e) throw new Error(`no Anima web entry for required feature "${r}"`);
  return e;
});
const entry = join(out, "entry.ts");
writeFileSync(entry, ["index", ...modules].map((m) => `import ${JSON.stringify(join(ANIMA, "packages/web/src", `${m}.ts`))};`).join("\n") + "\n");
// Anima's own production bundler (esbuild + terser, terse diagnostics), used read-only.
const code = execFileSync("node", ["--input-type=module", "-e",
  `const { bundle } = await import(${JSON.stringify(join(ANIMA, "tools/browser-build.ts"))});
   process.stdout.write(await bundle(${JSON.stringify(entry)}));`], { encoding: "utf8", cwd: ANIMA, maxBuffer: 1 << 26 });
const header = `// Anima runtime ${commit} (core + web${modules.length ? " + " + modules.join(", ") : ""}), built by golem/scripts/build-anima.ts. Not for redistribution.\n`;
writeFileSync(join(out, "anima.js"), header + code);
const info = { anima: { dir: ANIMA, commit }, runtime: { modules, bytes: code.length, gz: gz(code) }, scenes };
writeFileSync(join(out, "build.json"), JSON.stringify(info, null, 2) + "\n");
console.log(`anima.js: ${code.length} B, ${gz(code)} B gz (Anima ${commit}, modules: ${modules.join(", ") || "none"})`);
