// Writes every generated token output to packages/golem/dist/tokens/.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { outputs } from "../src/tokens/generate";

const dist = join(import.meta.dir, "..", "dist", "tokens");
mkdirSync(dist, { recursive: true });
for (const [file, text] of Object.entries(outputs())) {
  writeFileSync(join(dist, file), text);
  console.log(`${file}: ${text.length} B`);
}
