# Golem

The product layer of the stack: Onyx is the stone, Anima the soul.

Golem joins [Onyx](https://github.com/MRoiban/onyx) (React primitives with semantic theming) and [Anima](https://github.com/MRoiban/anima) (animation and interactivity) into one UI layer for Bedrock pebbles.

One package, `@mroiban/golem` ([packages/golem](packages/golem)), with subpaths:

- **Tokens** (`@mroiban/golem/tokens`, `tokens.css`): one source that generates Onyx's CSS variables, Anima's theme model and colour slots, and Glyphy's style targets.
- **Bridge** (`@mroiban/golem/anima`): `GolemProvider` and `<AnimaControl>`: lazy runtime loading, a shared model cache, progressive mounting, theme sync and reduced motion.
- **Components** (`@mroiban/golem`): Onyx primitives with optional Anima motion parts that fall back to plain Onyx when motion is off or Anima isn't loaded. Today: `Switch`.
- **App shell**: workbench layout, routing, command palette, keybindings and settings, to be extracted later from the apps that already have them.

Status: first milestone. See [docs/design.md](docs/design.md) for the design and its open questions, and [docs/anima-findings.md](docs/anima-findings.md) for Anima issues found along the way.

## Use

Install from a GitHub release tarball, which also carries the pinned Anima runtime and compiled scenes to serve. See [packages/golem/README.md](packages/golem/README.md).

```tsx
import "@mroiban/onyx/styles.css";          // or @bedrock/ui's styles.css
import "@mroiban/golem/tokens.css";         // after Onyx's CSS
import "@mroiban/golem/anima-slots.css";
import "@mroiban/golem/styles.css";
import { Switch } from "@mroiban/golem";

<Switch defaultChecked aria-label="Auto save" />
```

Motion turns on when the page names the runtime (`<meta name="golem-anima-runtime" content="/anima/anima.js">`, or `configureAnima`). Without it, or if the runtime fails to load, every component is plain Onyx.

## Develop

```sh
bun install
bun run build:tokens      # packages/golem/dist/tokens
bun run build:anima       # .anima/: Anima runtime + compiled scenes, from ANIMA_DIR (default ../anima),
                          # at the commit pinned in anima-pin.json
bun run dev               # demo on http://localhost:4620 (?theme= ?motion= ?anima=off ?many=N)
bun run test              # unit tests
bun run e2e               # Playwright, Chromium + Firefox (Anima tests skip without .anima/)
bun run sizes             # size report and budgets
bun run pack              # release/mroiban-golem-<version>.tgz (needs .anima/ built from the pin)
```

[Anima](https://github.com/MRoiban/anima) is still changing, so Golem pins a commit (`anima-pin.json`), builds it from a checkout into `.anima/`, and never commits its runtime or compiled scenes. The release tarball carries the runtime built from the pin. CI checks out the pinned commit and runs the full suite.

## Licence

MIT. See [LICENSE](LICENSE). Onyx is MIT; the Codicon glyphs it ships are CC BY 4.0 (Microsoft); the Flexoki palette is MIT (Steph Ango).
