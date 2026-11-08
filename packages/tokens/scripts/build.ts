// Writes every generated token output to packages/tokens/dist/.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { outputs } from "../src/generate";

const dist = join(import.meta.dir, "..", "dist");
mkdirSync(dist, { recursive: true });
for (const [file, text] of Object.entries(outputs())) {
  writeFileSync(join(dist, file), text);
  console.log(`${file}: ${text.length} B`);
}
