// Builds the @mroiban/golem release tarball into release/ (gitignored). Nothing is published:
// the release workflow attaches the tarball to a GitHub release when a v* tag is pushed.
//   bun scripts/pack.ts [--allow-unpinned]
// Needs `bun run build:tokens` and `bun run build:anima` first. The Anima runtime in the tarball
// must come from the commit in anima-pin.json (--allow-unpinned skips that check, for local tries).
//
// Layout of the package:
//   dist/*.js, dist/chunks/*   ESM, React and Onyx left external
//   types/**/*.d.ts            declarations
//   dist/styles.css, dist/tokens/*   CSS and the generated token files
//   runtime/anima.js, runtime/scenes/*.ani   the pinned Anima runtime and compiled scenes, to serve
//   runtime/ANIMA-LICENSE, runtime/build.json  Anima's licence; commit, modules and sizes
//   scenes/*.animl             scene sources
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const src = join(root, "packages/golem");
const out = join(root, "release");
const pkgDir = join(out, "golem");
const anima = join(root, ".anima");
const fail = (m: string): never => { console.error(m); process.exit(1); };

if (!existsSync(join(src, "dist/tokens/golem.css"))) fail("No token outputs: run bun run build:tokens.");
if (!existsSync(join(anima, "build.json"))) fail("No Anima build: run bun run build:anima.");
const build = JSON.parse(readFileSync(join(anima, "build.json"), "utf8"));
const pin: string = JSON.parse(readFileSync(join(root, "anima-pin.json"), "utf8")).commit;
if (!pin.startsWith(build.anima.commit) && !process.argv.includes("--allow-unpinned"))
  fail(`.anima/ was built from Anima ${build.anima.commit}, anima-pin.json pins ${pin.slice(0, 8)}. Build from the pin (ANIMA_DIR=<clean clone>).`);

rmSync(out, { recursive: true, force: true });
mkdirSync(pkgDir, { recursive: true });

// 1. JavaScript: one entry per subpath, shared code in chunks.
const entries = { index: "src/index.ts", anima: "src/anima/index.ts", tokens: "src/tokens/index.ts" };
const js = await Bun.build({
  entrypoints: Object.values(entries).map((e) => join(src, e)),
  root: join(src, "src"),
  outdir: join(pkgDir, "dist"),
  naming: { entry: "[dir]/[name].[ext]", chunk: "chunks/[name]-[hash].[ext]" },
  target: "browser",
  format: "esm",
  splitting: true,
  external: ["react", "react-dom", "react/jsx-runtime", "@mroiban/onyx"],
});
if (!js.success) fail(js.logs.join("\n"));
// Bun names entries by their path under root: index.js, anima/index.js, tokens/index.js.
const entryJs = { index: "./dist/index.js", anima: "./dist/anima/index.js", tokens: "./dist/tokens/index.js" };
for (const f of Object.values(entryJs)) if (!existsSync(join(pkgDir, f))) fail(`missing ${f}`);

// 2. Declarations.
const tsconfig = join(out, "tsconfig.types.json");
writeFileSync(tsconfig, JSON.stringify({
  extends: join(root, "tsconfig.json"),
  compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true, rootDir: join(src, "src"), outDir: join(pkgDir, "types"), types: [] },
  include: [join(src, "src")],
}));
execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", tsconfig], { stdio: "inherit" });

// 3. CSS and token files.
// styles.css @imports each component's CSS into the golem.components layer: flatten it.
const css = await Bun.build({ entrypoints: [join(src, "src/components/styles.css")], outdir: join(out, "css"), experimental: { css: true } } as never);
if (!css.success) fail(css.logs.join("\n"));
// Bun hoists the imported layers above the file's own @layer order statement; restate the order first.
writeFileSync(join(pkgDir, "dist/styles.css"), "@layer onyx.base, onyx.components, golem.tokens, golem.components;\n" + readFileSync(css.outputs[0]!.path, "utf8"));
cpSync(join(src, "dist/tokens"), join(pkgDir, "dist/tokens"), { recursive: true });
mkdirSync(join(pkgDir, "scenes"));
for (const s of build.scenes as { name: string; file: string }[]) cpSync(join(root, s.file), join(pkgDir, "scenes", `${s.name}.animl`));

// 4. The Anima runtime and scenes, with Anima's licence.
mkdirSync(join(pkgDir, "runtime"));
cpSync(join(anima, "anima.js"), join(pkgDir, "runtime/anima.js"));
cpSync(join(anima, "scenes"), join(pkgDir, "runtime/scenes"), { recursive: true });
const animaLicense = join(build.anima.dir, "LICENSE");
if (!existsSync(animaLicense)) fail(`No LICENSE in the Anima checkout ${build.anima.dir}.`);
cpSync(animaLicense, join(pkgDir, "runtime/ANIMA-LICENSE"));
const { dir: _dir, ...animaInfo } = build.anima;
writeFileSync(join(pkgDir, "runtime/build.json"), JSON.stringify({ ...build, anima: { ...animaInfo, repository: "github.com/MRoiban/anima", pinned: pin.startsWith(animaInfo.commit) ? pin : null } }, null, 2) + "\n");

// 5. package.json, README, LICENSE.
// The committed manifest, not the working copy: CI's install fallback (scripts/ci-install.sh) may
// have rewritten the Onyx URL to a local file: path.
const devText = (() => {
  try { return execFileSync("git", ["-C", root, "show", "HEAD:packages/golem/package.json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { return readFileSync(join(src, "package.json"), "utf8"); }
})();
const dev = JSON.parse(devText);
for (const [name, spec] of Object.entries(dev.dependencies as Record<string, string>))
  if (!/^(https:|\^|~|\d)/.test(spec)) fail(`dependency ${name}@${spec} cannot ship in a release`);
const entry = (name: keyof typeof entryJs, types: string) => ({ types, import: entryJs[name] });
const manifest = {
  name: dev.name,
  version: dev.version,
  description: dev.description,
  license: dev.license,
  repository: { type: "git", url: "git+https://github.com/MRoiban/golem.git" },
  homepage: "https://github.com/MRoiban/golem#readme",
  type: "module",
  sideEffects: ["*.css"],
  exports: {
    ".": entry("index", "./types/index.d.ts"),
    "./anima": entry("anima", "./types/anima/index.d.ts"),
    "./tokens": entry("tokens", "./types/tokens/index.d.ts"),
    "./styles.css": "./dist/styles.css",
    "./tokens.css": "./dist/tokens/golem.css",
    "./anima-slots.css": "./dist/tokens/anima-slots.css",
    "./tokens/*": "./dist/tokens/*",
    "./runtime/*": "./runtime/*",
    "./scenes/*": "./scenes/*",
    "./package.json": "./package.json",
  },
  files: ["dist", "types", "runtime", "scenes", "README.md", "LICENSE"],
  peerDependencies: dev.peerDependencies,
  dependencies: dev.dependencies,
};
writeFileSync(join(pkgDir, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
cpSync(join(root, "LICENSE"), join(pkgDir, "LICENSE"));
cpSync(join(src, "README.md"), join(pkgDir, "README.md"));

// 6. Tarball.
execFileSync("npm", ["pack", "--pack-destination", out, "--silent"], { cwd: pkgDir, stdio: ["ignore", "pipe", "inherit"] });
const tgz = readdirSync(out).find((f) => f.endsWith(".tgz"));
if (!tgz) fail("npm pack produced no tarball");
const size = readFileSync(join(out, tgz!)).length;
console.log(`release/${tgz}: ${(size / 1024).toFixed(1)} KB (Anima ${build.anima.commit}${pin.startsWith(build.anima.commit) ? ", the pin" : ", NOT the pin"})`);
