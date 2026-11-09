# Golem design

Golem joins Onyx (the stone: React primitives, semantic CSS-variable theming) and Anima (the soul:
AniML scenes, the `<anima-icon>` runtime) into one product layer for Bedrock pebbles. This document
records what the existing projects teach, the package layout, and the decisions this milestone
makes. Owner decisions still open are collected at the end.

Status: milestone 1 (tokens, Anima bridge, one proof component, demo, tests). The app shell is out of
scope for now; see "App shell: what to extract later".

## 1. Principles

1. **Golem decorates Onyx; it does not replace it.** A Golem component renders the Onyx primitive
   unchanged and adds an optional Anima *motion part* on top. Everything a user or assistive
   technology touches (role, state, focus, keyboard, form wiring) stays in the Onyx DOM.
2. **Plain Onyx is the base, not an afterthought.** The Onyx control renders first, on every page
   and in every mode. Anima only takes over painting once it is ready, so "motion off", "Anima not
   installed", "runtime failed" and "still loading" all look the same: correct Onyx.
3. **One token source.** Values are written once (`packages/golem/src/tokens/source.ts`). Onyx's CSS,
   Anima's theme data and Glyphy's style targets are generated from it, and tests fail when any
   output lacks a token.
4. **Abstractions come from real apps.** The app shell will be extracted from Typewriter and
   babel-ui, not designed ahead. Components are added one at a time, each proven end to end.
5. **Anima is a moving dependency.** Golem pins an Anima commit, builds from a checkout, declares
   the small part of its API it uses, and measures what it loads.

## 2. What the sources teach

| Source | What it is | What Golem takes |
| --- | --- | --- |
| anima-kit | Onyx × Anima prototype: 92 controls in 9 group files | A model cache per (file, component); progressive mounting; dark defaults so first frames are never black; `$theme:*` writes; Onyx's durations and easings. Not taken: semantics inside Anima's overlay, one big file per group, the vendored 318 KB runtime |
| Anima `docs/WEB.md`, `spec/SPEC.md` | Host API and format | `loadModel` and `AnimaIcon.compile` for shared compilation; colour slots (`var(--anima-<slot>)`); `motion="reduce"`; host is `aria-hidden` when the document has no a11y |
| Onyx 0.2.2 | Primitives and themes | Exported token tables (`ONYX_PALETTE`, `ONYX_SEMANTIC_DARK/LIGHT`, `ONYX_COMPONENT_TOKENS`), now Golem's parity oracle; cascade layers `onyx.base` / `onyx.components`; `data-theme` / `data-density` |
| `@bedrock/ui` | Onyx re-export, Bedrock components (AppShell, UserMenu, SignInGate, UploadButton), one prebuilt stylesheet | Its import contract (`styles.css`, then app CSS) is the one Golem's CSS fits into |
| Glyphy | Icon-style measurement and tracing | Its `[style]` table (grid, stroke, live area, padding) is the natural input for icon geometry tokens |
| Typewriter, babel-ui | Real app shells | The same Flexoki palette is mapped to Onyx tokens in three places today (Onyx, Babel's `services/flexoki.ts` + `onyx-theme.ts`, Typewriter's copy "adapted from Babel", plus anima-kit's `THEMES`), so a single token source is needed now. See §9 for shell parts |

anima-kit's measured lessons, and how Golem applies them:

- **Compiling a control costs about 55 ms; reuse compiled models.** Golem caches one model promise
  per (scene URL, component). Measured in the demo (Chromium): the first switch takes 15.6–97 ms to
  fetch and compile and 8–20 ms to instantiate; every other switch takes 0.8–2.8 ms to instantiate.
  All 28 were drawn 393 ms after navigation start on a quiet machine, and 645–867 ms with load
  average 50–70 from other agents.
- **Mount progressively.** A shared scheduler mounts motion parts within a 6 ms budget per frame,
  visible ones first (IntersectionObserver, 200 px margin). The Onyx control is already drawn, so the
  page never waits.
- **Off-screen hosts don't step.** Golem's switch draws with colour slots, which are CSS and correct
  before any step. Golem also settles each scene synchronously on mount with Anima's `settle()`. For
  data-model scenes, the generated Theme library defaults to the dark theme.
- **Theme tokens via `icon.data.color("$theme:x").set(...)`.** Golem supports this as the second
  theme path (§5.4) and prefers slots.
- **Reduced-motion CSS needs care with specificity.** See §5.5.

## 3. Package layout

One package, `@mroiban/golem`, in a Bun workspace (Bun 1.4, React 19). In the repo it exports
TypeScript source (the `@bedrock/ui` convention); `bun run pack` builds the release tarball with ESM,
declarations, CSS, and the Anima runtime and scenes built from the pin.

```
packages/golem/  @mroiban/golem
  src/tokens/      ./tokens, ./tokens.css, ./anima-slots.css: source.ts → generate.ts → dist/tokens/
                   (golem.css, anima-slots.css, golem-theme.animl, anima-themes.json,
                   glyphy-style.toml); anima.ts (names only)
  src/anima/       ./anima: GolemProvider, <AnimaControl>, runtime loader, model cache, mount
                   scheduler, theme bridge, motion
  src/components/  . (with GolemProvider, useGolem, configureAnima) and ./styles.css; one folder
                   per component: <name>.tsx, <name>.css, <name>.animl (compiled into the
                   tarball's runtime/scenes/). Catalogue and authoring guide: docs/components.md
demo/            the demo page (Bun.serve + HTML import); also the Playwright target
e2e/             Playwright tests (Chromium, Firefox)
scripts/         build-anima.ts (runtime + scenes from an Anima checkout), sizes.ts,
                 pack.ts (release tarball), smoke-pack.ts (installs the tarball in a fresh project)
docs/            design.md, anima-findings.md, proposals.md, screenshots/
```

One package rather than three: consumers install one tarball and one version, the subpaths keep
imports as narrow as separate packages would, and the internal folders keep the layering.
Dependency direction: `components → anima → tokens/anima`; `components → @mroiban/onyx`.
Nothing in Golem imports Anima at build time.

The demo is a plain page rather than a pebble. A pebble needs the `bedrock` link dependency and a
Bedrock install, and the milestone needs nothing from Bedrock's server side. Wrapping the demo in
`pebble.ts` later is a few lines.

## 4. Tokens

### 4.1 Source

`source.ts` is typed TypeScript, not JSON. It has these tiers, using Onyx's names so the output
drops into Onyx and `@bedrock/ui` unchanged:

- `palette`: raw colours (`--onyx-palette-*`).
- `base`: theme-independent tokens (space, type, radius, durations, easings, z, component defaults).
- `density`: compact and comfortable.
- `themes`: per theme, every theme-varying key (48 keys: surfaces, text, borders, controls, states,
  tones, shadows, overlay), plus optional `overrides` of base tokens (e.g. Rose's 14 px button radius).
- `animaColors` / `animaNumbers`: Anima token names (anima-kit's 35 names plus `shadowInk`), each
  mapped to an Onyx token.
- `icon`: Glyphy style keys.

Values are literals or references (`{palette.blue-600}`, `{radius-md}`). Light and dark were seeded
from Onyx 0.2.2's exported tables. `test/onyx-parity.test.ts` checks that Golem emits every Onyx
variable and that each resolves to Onyx's exact value in both themes. Two custom themes, each with
an authored light and dark variant:

- **Flexoki**: the workbench theme Typewriter and babel-ui each keep a copy of today. It is
  authored from the public Flexoki palette (MIT) and its UI roles: bg and bg-2 for surfaces;
  ui, ui-2 and ui-3 for borders, hover and selection; tx-2 for secondary text; 400-weight accents in
  dark. No code is taken from Typewriter or babel-ui.
- **Rose**: a demonstration of a brand theme (magenta accent, rounder controls through base-token
  overrides).

Dark themes are authored, not derived.

### 4.2 Outputs

| Output | Consumer | Notes |
| --- | --- | --- |
| `golem.css` | Onyx / `@bedrock/ui` pages | `@layer golem.tokens`, declared after `onyx.base`/`onyx.components`, so it overrides Onyx's defaults while unlayered app CSS still wins. Dark is the `:root` default as in Onyx. Alias tokens (`var(--onyx-…)` of non-palette tokens) are repeated in every theme block, as Onyx does, so `data-theme` on a subtree resolves them against its own colours |
| `anima-slots.css` | `<anima-icon>` | `--anima-<token>: var(--onyx-…)` for every Anima colour, plus `--golem-anima-<number>` per theme |
| `golem-theme.animl` | Anima scenes using a data model | anima-kit's `onyx-theme.animl`, generated. Defaults are dark. `scripts/build-anima.ts` validates it with the Anima CLI in a document that imports and binds it |
| `anima-themes.json` | Tools and tests | Every Anima token resolved to hex, per theme |
| `glyphy-style.toml` | Glyphy projects | A `[style]` table with the keys `locked`, so `glyphy measure` keeps Golem's values. Merge it into `glyphy.toml` or apply with `glyphy set style.<k>=<v>` |

Glyphy targets icon geometry, not colour (it traces black-on-white drafts). Its natural input is
therefore the `[style]` table, and Golem's `icon` tokens are the Codicon measurements Glyphy reports
for Onyx's icon set.

### 4.3 Tests

`bun test packages` covers:

- **Onyx parity**: every Onyx variable is emitted and has Onyx's value, for light and dark.
- **Completeness**: every theme declares every key in its own CSS block; every base and density
  token is in `:root`; every reference resolves in every theme.
- **Anima**: every Anima colour is in the slot CSS and the theme library and resolves to `#rrggbb`
  in every theme; every Anima number has a value and a CSS variable in every theme.
- **Glyphy**: every icon key is present and locked.
- **Build freshness**: `dist/` matches the generators.

The completeness test found a real mistake during development: Rose light set
`control-input-border`, a base token, inside its theme colours.

### 4.4 Prior art: wins taken, losses avoided

These summaries are from general knowledge of the projects, not checked against their current
docs for this milestone.

- **Style Dictionary.** *Taken*: one source, many platform outputs, references between tokens,
  generators as plain functions. *Avoided*: a config-driven transform/format pipeline and JSON-only
  sources. Golem has three outputs, so typed TS plus five small functions is clearer, and the type
  checker catches a misspelled key. If tokens later need to leave the JS world (iOS, Figma), emitting
  W3C design-token JSON from the same source is one more generator.
- **Radix Themes.** *Taken*: light and dark authored as pairs, and a custom theme as a small set of
  overrides on a base theme (Rose = light + 6 keys). *Avoided*: fixed 12-step scales with implied
  meaning and a large runtime stylesheet. Onyx's semantic names (surface, control, state, tone)
  already say what a colour is for.
- **Open Props.** *Taken*: tokens as plain CSS custom properties consumable with no JS; motion tokens
  (durations, easings) that collapse under reduced motion. *Avoided*: a very large, flat namespace
  with no check that a token is used or defined. Golem's tests enforce completeness per theme.
- **Motion (framer-motion).** *Taken*: an app-level reduced-motion policy (`MotionConfig
  reducedMotion="user"` corresponds to Golem's `motion="system"`), and lazy feature loading
  (`LazyMotion` corresponds to loading the Anima runtime only when motion is on). *Avoided*:
  animation state living in React props and re-renders. Anima runs its own sleeping scheduler, and
  React only writes inputs.
- **React Spring.** *Taken*: a global skip-animation switch (`Globals.assign({ skipAnimation })`
  corresponds to Golem's `motion="reduced"`) and an imperative handle for one-off effects (a `fire()`
  handle for triggers). *Avoided*: per-component spring configuration. Durations and easings come
  from tokens (100 / 160 / 240 ms, Onyx easings) inside the scene.

## 5. The Anima bridge (`@mroiban/golem/anima`)

### 5.1 Runtime loading

`GolemProvider anima={{ runtime, scenes }}` configures URLs. The runtime is loaded with a dynamic
`import(url)` the first time a motion part needs it, never at build time. States are `idle`,
`loading`, `ready` and `absent`. A missing URL, a 404 or a failing module all end in `absent` with
one `console.info`, and every control stays plain Onyx.

### 5.2 Model cache

`getModel(src, component)` keeps one promise per (scene URL, component). It fetches the `.ani` once,
compiles it once with `AnimaIcon.compile()` (falling back to a detached `load()` on older
runtimes), and every host instantiates it with `loadModel()`. Failures evict the entry, so a later
mount can retry.

### 5.3 `<AnimaControl>`

```tsx
<AnimaControl scene="switch" inputs={{ on: checked, down }} onStatus={setStatus} ref={handle} />
handle.current?.fire("pop");
```

- It renders a `span.golem-anima` (`aria-hidden`, `data-status`) and appends an `<anima-icon>` to it
  imperatively. The icon is `aria-hidden`, has `pointer-events: none` through the caller's CSS, and
  never takes focus.
- Status is `off`, `pending` or `ready`. Callers switch their CSS on `ready` only.
- On mount it writes the inputs and theme data, then `settle()`s the scene to rest, then
  reports `ready`. Later input changes are diffed and written with `set()`.
- With motion not `anima`, it renders nothing.
- Unmount calls `destroy()` and removes the icon.

### 5.4 Theme sync: two paths

1. **Colour slots (default).** Scenes declare `<color name="buttonBg" value="#…"/>`. The host renders
   `var(--anima-buttonBg, #…)`, and `anima-slots.css` points that at `var(--onyx-control-button-bg)`.
   Theme switches, scoped `data-theme` subtrees, and apps that set Onyx variables inline (Typewriter
   does) reach the drawing through CSS with no script, also off screen and on the first frame. The
   e2e test checks that the switch's on-fill equals `--onyx-control-button-bg` in all four themes and
   follows a live theme change without remounting.
2. **Theme data model.** Scenes that must animate or mix theme colours (slots cannot, findings F4)
   import `golem-theme.animl` and bind `$theme:<token>`. `writeThemeData` copies the icon's computed
   `--anima-*` colours and `--golem-anima-*` numbers into the model. It runs on mount, on the
   provider's theme change, and on any mutation of `<html>`'s `data-theme`/`style`/`class`. This path
   is unit-tested for colour parsing only. No scene uses it yet, so it has no browser test; the first
   scene that needs it should add one.

### 5.5 Motion and reduced motion

`motion` is `system` (default), `anima`, `css` or `reduced`. `system` follows
`prefers-reduced-motion` live: no preference gives `anima`, reduce gives `reduced`.

- **`anima`**: motion parts mount.
- **`css`**: plain Onyx with its own CSS transitions (anima-kit's "Onyx motion").
- **`reduced`**: plain Onyx with transitions cut to 1 ms. Motion parts unmount, and their compiled
  models stay cached for a cheap return.

The provider writes `data-golem-motion` on `<html>`.

The specificity trap: Onyx's reduced rule is `!important` inside `@layer onyx.base`. An `!important`
declaration in a layer beats an unlayered `!important` one, the reverse of normal declarations. So
Golem's in-app `reduced` rule is deliberately unlayered. When the OS asks for reduced motion, Onyx's
rule wins and says 1 ms; when only the app asks, Onyx's rule does not apply and Golem's does. Both
say 1 ms, so they never conflict. Golem's ordinary component rules live in `@layer golem.components`
(after Onyx's layers) and need no `!important`.

### 5.6 Semantics

The React side owns semantics. anima-kit put `<a11y>` nodes in its scenes, and Anima drew semantic
overlays in its shadow DOM. That needed focus-following and click-routing workarounds and gave the
controls two DOMs of truth. Golem's scenes declare no a11y, so Anima marks the host `aria-hidden`
and adds no role or tab stop. The Onyx `<button role="switch">` keeps `aria-checked`, the Field
label, the focus ring, Space/Enter and form reset. The e2e tests check roles, labels, Tab order
(including skipping the disabled switch), keyboard toggling, the visible focus ring, and that no
Anima node is exposed.

## 6. Components

The pattern, shown by `Switch`:

```tsx
<span class="golem-switch" data-anima="off|pending|ready">
  <OnyxSwitch {...props} />        ← unchanged Onyx primitive: semantics, focus, keyboard, forms
  <AnimaControl scene="switch" …/> ← decorative overlay, inset 0, pointer-events none
</span>
```

- **State flows one way, from the DOM.** The wrapper reads Onyx's `aria-checked` (a
  MutationObserver) instead of re-implementing controlled/uncontrolled logic. So controlled,
  uncontrolled, Field wiring and form reset behave exactly as in Onyx, whoever changes them.
- **Swap only when ready.** `[data-anima='ready']` makes Onyx's track transparent and hides its thumb.
  The focus ring is a box-shadow outside the drawing and stays visible.
- **The scene draws the primitive's geometry.** Onyx compact switch: track 31.5×17.5, padding 2,
  thumb 13.5, travel 14. Durations and easings are Onyx's. The colours are token slots. The scene
  adds what CSS cannot: the thumb stretches (×1.36) as it travels, and squashes (×1.18) while
  pressed. It uses only core features (paths, circles, layers, a timeline, a trigger), so it needs no
  optional Anima module.
- At comfortable density the drawing scales uniformly. Onyx keeps its 2 px padding fixed, so the
  thumb is about 1 px off at 36 px controls. That is acceptable for now; a density input can fix it.

The catalogue of components and the authoring contract are in `docs/components.md`. Candidates were, in the order anima-kit proved them: Button (spinner → check), Tabs and ToggleGroup
(travelling indicator), Checkbox (wipe-in check). Each gets the same treatment: an Onyx primitive, a
core-only scene where possible, a fallback test, and a size line.

## 7. Golem and `@bedrock/ui`

`@bedrock/ui` today is `export * from "@mroiban/onyx"`, four Bedrock components that need a Bedrock
client, and a prebuilt stylesheet (Onyx's CSS with the Codicon font, plus Bedrock layouts).

**Decision (owner, 2026-11-08): pebbles get motion without any code changes.** Golem stays its own
package; `@bedrock/ui` re-exports it. A pebble that imports `Switch` from `@bedrock/ui` and loads
`@bedrock/ui/styles.css` gets the Anima motion part, and still gets plain Onyx where Anima is
missing or motion is reduced.

- Golem must work on any Onyx page, including babel-ui (Electron, its own Onyx copy). It cannot
  depend on Bedrock, so it is not absorbed into `@bedrock/ui`.
- Golem does not replace `@bedrock/ui`. AppShell, UserMenu, SignInGate and UploadButton depend on
  Bedrock's client and belong to Bedrock.

What "no code changes" needs, and where each part lives:

| Need | Where | Status |
| --- | --- | --- |
| Golem components work without a `GolemProvider` (motion follows `prefers-reduced-motion`; colours follow the page CSS) | Golem `useGolem()` | Done, e2e `?provider=off` |
| The runtime is found without app code: `<meta name="golem-anima-runtime">` and `<meta name="golem-anima-scenes">` | Golem `runtime.ts` | Done, e2e |
| `@bedrock/ui` exports Golem's `Switch` (and later components) in place of Onyx's, same props | `@bedrock/ui` `src/index.ts` | Proposal |
| `@bedrock/ui/styles.css` appends `golem.css`, `anima-slots.css` and `@mroiban/golem/styles.css` | `@bedrock/ui` `scripts/build-css.ts` | Proposal |
| Bedrock serves the Anima runtime and Golem's compiled scenes, and injects the two meta tags into every pebble page | Bedrock dev server and deploy | Proposal; the files ship in Golem's tarball (`runtime/`) |

Golem's CSS already layers on top of `@bedrock/ui/styles.css` without changes (the `golem.tokens`
and `golem.components` layers come after `onyx.*`), so the stylesheet change is an append. The
proposals are in `docs/proposals.md`.

## 8. Consuming Anima while it changes

- **Pinned, built from a checkout, never vendored.** Anima is public (github.com/MRoiban/anima,
  MIT). `anima-pin.json` names the commit Golem is built and tested against. (It is not called
  `anima.json`: the Anima CLI reads any `anima.json` above a source file as its project
  configuration.) `scripts/build-anima.ts` reads `ANIMA_DIR` (default `../anima`) and warns when
  the checkout is not at the pin. It
  validates the generated theme library, compiles every `packages/*/scenes/*.animl` with the Anima
  CLI, and bundles the runtime (core + web + exactly the modules the scenes' `requires` name) with
  Anima's own production bundler. Output goes to `.anima/` (gitignored) with `build.json` recording
  the Anima commit, modules and sizes. Nothing from Anima, and no compiled `.ani`, is committed.
- **A small declared surface.** `anima-react/src/types.ts` declares the eight members Golem uses
  (`ready`, `player`, `load`, `loadModel`, `set`, `fire`, `invalidate`, `destroy`, and optional
  `data`). The rest of Anima can change freely. The scenes use only core AniML.
- **Feature detection over version checks.** `compile()` is optional (with a fallback), `data` is
  optional, and a load failure means fallback.
- **CI runs everything.** CI checks out Anima at the pinned commit, installs its build tools
  (`npm ci`), runs `build:anima`, and runs the full Playwright suite in Chromium and Firefox. The
  Anima tests skip themselves only where there is no `.anima/` (a contributor without a checkout).
- **Bumping Anima** is a PR that changes `anima-pin.json`; CI shows whether Golem still works with it.
- **Findings**, not patches: `docs/anima-findings.md`.

## 9. Size budgets

Golem measures what it adds on top of React + Onyx (`bun run sizes`, min + gzip -9; failing a
budget exits non-zero). Numbers at Anima `05f37885`:

| What | min+gz | Budget |
| --- | ---: | ---: |
| `@mroiban/golem/anima` (bridge, JS) | 3.68 KB | 4 KB |
| `@mroiban/golem` (Switch + bridge, JS) | 3.90 KB | 6 KB |
| `@mroiban/golem/styles.css` | 0.75 KB | 1 KB |
| `golem.css` (6 themes; replaces Onyx's token blocks when used) | 2.73 KB | 6 KB |
| `anima-slots.css` | 0.56 KB | 1 KB |
| `switch.ani` | 0.80 KB | Anima gate: 64 KB per scene |
| Anima runtime, core + web (no optional modules needed) | 20.70 KB | Anima gate: 24 KB |
| App-UI total (Golem JS + CSS + runtime + scenes) | 27.13 KB | Anima gate: 128 KB |

The runtime is loaded only when motion is on; with motion off, Golem costs its JS and CSS only.
Per-component rule: JS ≤ 2 KB, scene ≤ 8 KB gz, and no optional Anima module without a size line
in the PR.

## 10. App shell: what to extract later

Observed now, to extract once both apps have settled (not designed here):

- **Router**: Typewriter `web/shell/router.ts` (27 lines, `useSyncExternalStore` over
  `history`/`popstate`, typed `Route` union). Small and generic, so a good first extraction.
- **Appearance and theme application**: Typewriter `appearance.ts` (persisted theme, editor font size,
  cross-window sync, applies Onyx variables on `<html>`, `theme-color` meta). Babel
  `services/theme.ts`, `themes.ts`, `onyx-theme.ts`, `flexoki.ts`. These should collapse onto
  `@mroiban/golem/tokens` (a Flexoki workbench theme in the source) plus a small `useAppearance`.
- **Commands, keybindings and palette**: babel-ui `services/commands.ts`, `keybindings.ts` (chord
  timeout, text-input reservations), `palette.ts` with a fuzzy matcher, `context.ts` (`when`
  clauses), `menus.ts`. Typewriter has a smaller `Shortcuts.tsx`. Extract Babel's model once
  Typewriter adopts it.
- **Workbench layout**: Typewriter `Workbench.tsx` (resizable sidebar, editor and preview panes with
  remembered sizes, tabs). babel-ui `services/layout.ts`, `views.ts`, `slots.ts` (slot contributions
  with error isolation) and the documented shell geometry (title row 28 px, activity bar 48 px,
  sidebar 300 px resizable 200 px–80vw, status bar 22 px).
- **Settings and persistence**: babel-ui `settings.ts` (schemas, defaults, validation) and
  `persistence-client.ts`; Typewriter stores appearance in `localStorage`.
- **Dialogs and toasts**: babel-ui `dialogs.ts` (queued Onyx prompts), `toasts.ts`; Typewriter
  `dialogs.tsx`.

## 11. Owner decisions and open questions

Decided (2026-11-08):

- **Golem vs `@bedrock/ui`**: pebbles get motion without any code changes (§7).
- **Licence**: MIT.
- **First real custom theme**: Flexoki, light and dark, authored in the token source from the public
  Flexoki palette and its UI roles. Rose stays as a demonstration.
- **Harmony and derived dark modes**: out of scope; dark themes are authored.
- **Anima is public** (MIT). Golem pins a commit and CI builds and tests against it (§8).
- **Package**: one `@mroiban/golem` with subpaths, shipped as a GitHub release tarball like Onyx
  (never npm). The tarball carries the Anima runtime and compiled scenes built from the pin (§3).

Open:

1. **Cutting the first release.** CI attaches the tarball to a GitHub release when a `v*` tag
   matching `packages/golem/package.json` (0.1.0) is pushed. No tag has been pushed yet.
