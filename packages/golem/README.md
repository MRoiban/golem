# @mroiban/golem

[Onyx](https://github.com/MRoiban/onyx) components with [Anima](https://github.com/MRoiban/anima) motion, and the design tokens that theme both. Every component is plain Onyx until the Anima runtime loads, and stays plain Onyx if it doesn't.

## Install

From a GitHub release (not on npm):

```sh
bun add https://github.com/MRoiban/golem/releases/download/v0.1.0/mroiban-golem-0.1.0.tgz
```

Peers: `react` and `react-dom` 19. `@mroiban/onyx` is a dependency.

## Use

```tsx
import "@mroiban/onyx/styles.css";          // or @bedrock/ui's styles.css
import "@mroiban/golem/tokens.css";         // after Onyx's CSS
import "@mroiban/golem/anima-slots.css";
import "@mroiban/golem/styles.css";
import { Switch } from "@mroiban/golem";

<Switch defaultChecked aria-label="Auto save" />
```

### Motion

Serve the package's `runtime/` folder (the Anima runtime and the compiled scenes) and tell the page where it is. Either with two meta tags, which need no app code:

```html
<meta name="golem-anima-runtime" content="/anima/anima.js">
<meta name="golem-anima-scenes" content="/anima/scenes/">
```

or in code: `configureAnima({ runtime: "/anima/anima.js", scenes: "/anima/scenes/" })`, or `<GolemProvider anima={…}>`.

With Bun, for example: `cp -r node_modules/@mroiban/golem/runtime public/anima`.

`runtime/build.json` names the Anima commit the runtime was built from. Anima is MIT; its licence is in `runtime/ANIMA-LICENSE`.

### Themes and motion preference

Themes are `data-theme` on `<html>` (or any subtree): `dark` (default), `light`, `rose`, `rose-dark`, `flexoki`, `flexoki-dark`. `GolemProvider` can set it: `<GolemProvider theme="light" motion="system">`. Motion is `system` (follows `prefers-reduced-motion`), `anima`, `css` or `reduced`.

## Subpaths

| Import | What |
| --- | --- |
| `@mroiban/golem` | Components (`Switch`), `GolemProvider`, `useGolem`, `configureAnima` |
| `@mroiban/golem/anima` | The bridge: `AnimaControl`, the runtime loader, model cache, motion and theme helpers |
| `@mroiban/golem/tokens` | Token tables and generators |
| `@mroiban/golem/tokens.css`, `/anima-slots.css`, `/styles.css` | CSS |
| `@mroiban/golem/tokens/*` | Generated files: `golem-theme.animl`, `anima-themes.json`, `glyphy-style.toml` |
| `@mroiban/golem/runtime/*` | The Anima runtime and compiled scenes, to serve |
| `@mroiban/golem/scenes/*` | Scene sources (AniML) |

## Licence

MIT. Anima (in `runtime/`) is MIT.
