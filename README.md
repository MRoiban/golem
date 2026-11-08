# Golem

The product layer of the stack: Onyx is the stone, Anima the soul.

Golem joins [Onyx](https://github.com/MRoiban/onyx) (React primitives with semantic theming) and Anima (animation and interactivity) into one UI layer for Bedrock pebbles:

- **Tokens** (`@golem/tokens`): one source that generates Onyx's CSS variables, Anima's theme model and colour slots, and Glyphy's style targets.
- **Bridge** (`@golem/anima-react`): `GolemProvider` and `<AnimaControl>`: lazy runtime loading, a shared model cache, progressive mounting, theme sync and reduced motion.
- **Components** (`@golem/components`): Onyx primitives with optional Anima motion parts that fall back to plain Onyx when motion is off or Anima isn't loaded. Today: `Switch`.
- **App shell**: workbench layout, routing, command palette, keybindings and settings, to be extracted later from the apps that already have them.

Status: first milestone. See [docs/design.md](docs/design.md) for the design and its open questions, and [docs/anima-findings.md](docs/anima-findings.md) for Anima issues found along the way.

## Use

```tsx
import "@mroiban/onyx/styles.css";          // or @bedrock/ui/styles.css
import "@golem/tokens/golem.css";            // after Onyx's CSS
import "@golem/tokens/anima-slots.css";
import "@golem/components/styles.css";
import { GolemProvider } from "@golem/anima-react";
import { Switch } from "@golem/components";

<GolemProvider theme="dark" motion="system" anima={{ runtime: "/anima/anima.js", scenes: "/anima/scenes/" }}>
  <Switch defaultChecked aria-label="Auto save" />
</GolemProvider>
```

Without `anima` (or with a runtime that fails to load) every component is plain Onyx.

## Develop

```sh
bun install
bun run build:tokens      # packages/tokens/dist
bun run build:anima       # .anima/: Anima runtime + compiled scenes, from ANIMA_DIR (default ../anima)
bun run dev               # demo on http://localhost:4620 (?theme= ?motion= ?anima=off ?many=N)
bun run test              # unit tests
bun run e2e               # Playwright, Chromium + Firefox (Anima tests skip without .anima/)
bun run sizes             # size report and budgets
```

Anima is private and still changing. Golem builds it from a local checkout into `.anima/` and never commits its runtime or compiled scenes.

## Licence

MIT. See [LICENSE](LICENSE). Onyx is MIT; the Codicon glyphs it ships are CC BY 4.0 (Microsoft); the Flexoki palette is MIT (Steph Ango).
