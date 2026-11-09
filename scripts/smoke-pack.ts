// Installs the packed tarball into a fresh project (release/smoke/) and checks it the way a
// consumer would: types resolve (tsc), every subpath bundles (Bun.build), the runtime files exist,
// and the main entry renders on the server.   bun scripts/smoke-pack.ts
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const release = join(root, "release");
const tgz = readdirSync(release).find((f) => f.endsWith(".tgz"));
if (!tgz) throw new Error("no tarball: run bun run pack");
const dir = join(release, "smoke");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir);
writeFileSync(join(dir, "package.json"), JSON.stringify({
  name: "golem-smoke", private: true, type: "module",
  dependencies: { "@mroiban/golem": `file:../${tgz}`, react: "^19.0.0", "react-dom": "^19.0.0" },
  devDependencies: { typescript: "^5.9.3", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0" },
  // CI sets ONYX_TGZ when GitHub's release download URL is down (scripts/ci-install.sh).
  ...(process.env.ONYX_TGZ ? { overrides: { "@mroiban/onyx": `file:${process.env.ONYX_TGZ}` } } : {}),
}, null, 2));
writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({
  compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: false, lib: ["ES2022", "DOM"] },
  include: ["app.tsx"],
}));
writeFileSync(join(dir, "app.tsx"), `import "@mroiban/onyx/styles.css";
import "@mroiban/golem/tokens.css";
import "@mroiban/golem/anima-slots.css";
import "@mroiban/golem/styles.css";
import { Switch, GolemProvider, configureAnima, type MotionSetting } from "@mroiban/golem";
import { AnimaControl, modelCacheSize } from "@mroiban/golem/anima";
import { themes, onyxCss } from "@mroiban/golem/tokens";
const motion: MotionSetting = "system";
configureAnima({ runtime: "/anima/anima.js", scenes: "/anima/scenes/" });
export const themeNames: string[] = Object.keys(themes);
export const sizes = [onyxCss().length, modelCacheSize()];
export const unused = AnimaControl;
export const App = () => <GolemProvider theme="light" motion={motion}><Switch defaultChecked aria-label="Auto save" /></GolemProvider>;
`);
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: dir, stdio: "inherit" });
run("bun", ["install"]);
run(join(dir, "node_modules/.bin/tsc"), ["-p", "."]);
const built = await Bun.build({ entrypoints: [join(dir, "app.tsx")], outdir: join(dir, "out"), target: "browser" });
if (!built.success) throw new Error(built.logs.join("\n"));
const pkg = join(dir, "node_modules/@mroiban/golem");
for (const f of ["runtime/anima.js", "runtime/scenes/switch.ani", "runtime/ANIMA-LICENSE", "runtime/build.json", "dist/tokens/golem-theme.animl"])
  if (!existsSync(join(pkg, f))) throw new Error(`missing ${f}`);
writeFileSync(join(dir, "ssr.tsx"), `import { renderToString } from "react-dom/server";
import { App } from "./app";
const html = renderToString(<App />);
if (!html.includes('role="switch"') || !html.includes('aria-checked="true"')) throw new Error("bad SSR: " + html);
console.log("ssr ok");
`);
run("bun", ["ssr.tsx"]);
// Again with React's production build, as a consumer's production bundle gets it.
execFileSync("bun", ["ssr.tsx"], { cwd: dir, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
console.log(`smoke ok: ${tgz}`);
