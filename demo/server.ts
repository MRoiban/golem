// Demo page: bun demo/server.ts (PORT, default 4620). Serves the page (bundled by Bun) and the
// locally built Anima runtime and scenes from .anima/ at /anima/. Without .anima/ (no Anima
// checkout) the page still works: every control falls back to plain Onyx.
import { existsSync } from "node:fs";
import { join, normalize } from "node:path";
import index from "./index.html";
import play from "./play.html";

const anima = join(import.meta.dir, "..", ".anima");
const server = Bun.serve({
  port: Number(process.env.PORT ?? 4620),
  development: process.env.NODE_ENV !== "production",
  routes: { "/": index, "/play": play },
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/anima/")) {
      const rel = normalize(pathname.slice("/anima/".length));
      const file = join(anima, rel);
      if (!rel.startsWith("..") && existsSync(file)) {
        const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".ani") ? "application/json" : undefined;
        return new Response(Bun.file(file), { headers: type ? { "content-type": type } : {} });
      }
    }
    return new Response("Not found", { status: 404 });
  },
});
console.log(`Golem demo: ${server.url}${existsSync(join(anima, "anima.js")) ? "" : " (no .anima/: plain Onyx only; run bun run build:anima)"}`);
