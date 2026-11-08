# Golem components: catalogue and authoring guide

Every Golem component is an Onyx primitive with an optional Anima **motion part**. This file is
the contract for writing one, and the list of which Onyx primitives get one.

## Catalogue

Status: `done` (merged, tests and screenshots in the repo), `planned`, or `none` (no motion part:
Golem does not wrap it; use Onyx's directly).

| Component | Motion part | Group | Status |
| --- | --- | --- | --- |
| Switch | Thumb stretches as it travels, squashes while pressed | choice | done |
| Checkbox | Check stroke draws in; indeterminate dash morphs; box pops | choice | done |
| RadioGroup | Selected dot grows in with a small overshoot; old dot shrinks | choice | done |
| Toggle | Pressed state eases in, press squash | choice | done |
| Button | Press squash; `loading` morphs label space into a spinner; optional success check / error shake | actions | planned |
| Spinner | Anima-drawn arc spinner (Onyx timing) | actions | planned |
| Progress | Fill eases to value; indeterminate sweep | actions | planned |
| Meter | Fill eases to value, tone colour follows thresholds | actions | planned |
| Tabs | Selected indicator travels between tabs and stretches | indicators | planned |
| ToggleGroup | Selected pill travels between items | indicators | planned |
| SectionSelect | Selected pill travels between sections | indicators | planned |
| Slider | Thumb squashes while dragged; keyboard step pop; Onyx range fill follows | ranges | done |
| PasswordField | Eye opens/closes when visibility toggles | ranges | done |
| Tabs | Selected indicator travels between tabs and stretches | indicators | done |
| ToggleGroup | Selected pill travels between items | indicators | done |
| SectionSelect | Selected pill travels between sections | indicators | done |
| Slider | Thumb squashes while dragged; range fill follows | ranges | planned |
| PasswordField | Eye opens/closes when visibility toggles | ranges | planned |
| Collapsible | Chevron rotates with overshoot | disclosure | planned |
| Accordion | Chevron per item rotates with overshoot | disclosure | planned |
| Toast | Tone icon draws in (check, cross, info, warning) | disclosure | planned |
| Alert | Tone icon draws in once on mount | disclosure | planned |

`none`: layout and text (Layout, Text, Card, Panel, Separator, Kbd, Link, Breadcrumb, Table, Tree,
List, VirtualList, ScrollArea, SplitView, ResizeHandle, Sidebar, StatusBar, Toolbar), overlays whose
motion is CSS enter/exit (Dialog, AlertDialog, Sheet, Popover, Tooltip, HoverCard, Menu, Menubar,
ContextMenu, NavigationMenu, Select, Combobox, Command), text inputs (Input, Textarea, InputGroup,
SearchField, NumberField, OtpField), pickers (Calendar, DatePicker, ColorPicker, ColorSwatch),
Badge, Tag, Avatar, Skeleton, EmptyState, Pagination, Carousel, DropZone, FileTrigger. Onyx's CSS
motion already covers them, or motion would not help. A row moves out of `none` when a design
reason appears, not by default.

## The pattern

```
<span class="golem-<name> golem-part" data-golem-part="<name>" data-anima="off|pending|ready">
  <Onyx primitive …props/>            ← owns role, aria-*, focus, keyboard, pointer, forms
  <AnimaControl scene="<name>" className="golem-part__motion" inputs={…}/>   ← aria-hidden drawing
</span>
```

Rules, all of them tested:

1. **Onyx owns semantics.** Roles, `aria-*`, focus, keyboard, Field wiring, form reset and
   controlled/uncontrolled props are Onyx's, unchanged. Props are Onyx's props (`export type
   XProps = OnyxXProps`, plus at most a few Golem-only props, documented). Forward the ref to the
   element Onyx forwards it to.
2. **State flows one way, from the DOM.** Read state back from the attributes Onyx renders
   (`aria-checked`, `data-state`, `aria-selected`, `aria-valuenow`, `aria-busy`, …) with
   `useDomState` (`components/shared.ts`). Never re-implement Onyx's state logic.
3. **The drawing is decorative.** `AnimaControl` renders `aria-hidden`, `pointer-events: none`,
   no tab stop. Pointer events go to the Onyx element underneath.
4. **Swap only when ready.** CSS hides Onyx's own painted parts only under `[data-anima='ready']`.
   With motion off (`css` or `reduced`, or the OS asking for reduced motion), Anima missing, still
   loading or failed, the plain Onyx rendering shows. Focus rings stay visible (they are Onyx's box
   shadows or outlines outside the drawing: never hide them).
5. **Start at rest.** `AnimaControl` writes the inputs and settles the scene before first paint: a
   control that mounts checked must not animate in. Fire one-shot triggers only on a change after
   `ready` (`useFireOnChange`).
6. **Geometry and timing are Onyx's.** Read the primitive's CSS in
   `node_modules/@mroiban/onyx/dist/styles.css` (and `src/components/<name>.tsx`) and draw the
   same box in px (viewBox = the part's px size), at compact density. Use Onyx's durations and
   easings (`--onyx-duration-*`, `cubic(0.2, 0, 0, 1)` standard, `cubic(0.2, 0, 0.16, 1)` emphasis).
   Motion is a garnish: 80–240 ms, no loops except spinners and indeterminate progress.
7. **Colours are token slots.** Declare `<color name="<token>" value="#<dark default>"/>` with a
   name from `animaColors` (`src/tokens/anima.ts`): the host renders `var(--anima-<token>)`, which
   `anima-slots.css` points at the Onyx token, so every theme works with no script. The dark-theme
   hex is the default (`dist/tokens/anima-themes.json`). Slots cannot animate (findings F4): to
   change colour, cross-fade two shapes' opacity.
8. **Core AniML where possible.** Paths, circles, groups, layers, states, poses, timelines,
   triggers. Rounded rects as paths with arcs (`corners` needs `paint`, F8). Guards use `!x` and
   `&&` (F7). A scene that needs an optional module (e.g. `bind` for numeric positions) may use it:
   say why in the scene's header comment; `bun run sizes` then budgets the runtime at 32 KB.
9. **Fallback is plain Onyx, and identical in behaviour.** Every test that passes with
   `motion=anima` must pass with `motion=css` and with `anima=off`, apart from drawing checks.

## Files for a component `<name>`

| File | What |
| --- | --- |
| `packages/golem/src/components/<name>/<name>.tsx` | The wrapper (`export const <Name>`, `export type <Name>Props`) |
| `packages/golem/src/components/<name>/<name>.css` | Its CSS, plain rules (imported into the `golem.components` layer) |
| `packages/golem/src/components/<name>/<name>.animl` | Its scene(s); each `.animl` compiles to `<file>.ani`; scene names are global, so prefix extra files with the component name |
| `packages/golem/src/components/index.ts` | One export line |
| `packages/golem/src/components/styles.css` | One `@import "./<name>/<name>.css" layer(golem.components);` line, after the others |
| `demo/sections/<name>.tsx` + one line in `demo/sections/index.ts` | A demo section (`<Section id="<name>">`): every state, a controlled example, disabled, and a plain-Onyx reference row |
| `e2e/<name>.spec.ts` | Behaviour tests (below), always `?c=<name>` |
| `e2e/<name>-frames.spec.ts` | `SHOTS=1` only: deterministic motion frames into `docs/screenshots/<name>/frames-*.png` |
| `docs/screenshots/<name>/*.png` | The gallery (`e2e/gallery.spec.ts`) and the frames |
| this file | The catalogue row's status |

## Tests every component needs (`e2e/<name>.spec.ts`)

Use the helpers in `e2e/helpers.ts` (`settled`, `watchConsole`, `expectDecorativeOnly`,
`expectNoHorizontalOverflow`, `pauseParts`, `resolvedColor`, `THEMES`). Chromium and Firefox both run.

1. **No console errors or warnings** with `motion=anima`, `motion=css`, `motion=reduced`,
   `anima=off&motion=anima`, while exercising every interaction and switching all themes.
2. **Roles and keyboard**, with `motion=anima` and `motion=css`: roles, names, states, the keyboard
   interactions Onyx supports (Space/Enter/arrows/Home/End as applicable), disabled items skipped,
   focus ring visible, `expectDecorativeOnly`.
3. **The drawing follows the Onyx state**: change state by pointer, keyboard and controlled props,
   then read the drawing (shadow-root SVG attributes or computed geometry) and assert it matches.
   Include "mounts at rest": an initially-on control is drawn on, with no animation in flight.
4. **Pointer events reach Onyx** through the drawing (clicking where the drawing is changes state).
5. **Themes**: in all 6 themes, the drawing's slot colours resolve to the Onyx token they stand for.
6. **Reduced motion**: `motion=reduced`, and `motion=system` with the browser emulating
   `prefers-reduced-motion: reduce`: no `anima-icon`, Onyx's own visuals show, behaviour identical.
7. **Fallback**: `anima=off`: no `anima-icon`, no errors, Onyx's visuals show, behaviour identical.
8. **Phone width** (360 px): no horizontal overflow, with `motion=anima` and `motion=css`.

## Screenshots, and looking at them

```sh
SHOTS=1 GALLERY=<name> bunx playwright test e2e/gallery.spec.ts e2e/<name>-frames.spec.ts --project chromium
bun scripts/contact-sheet.ts <name>     # docs/screenshots/<name>/sheet.png: everything in one image
```

Frames go in `docs/screenshots/<name>/frames-*.png`. The contact sheet is for triage; open the
originals for detail. Element screenshots at half-pixel positions can look shifted by up to 1 CSS
px: measure boxes (`getBoundingClientRect`, including the SVG in the shadow root) before deciding
the drawing is misaligned.

Open every PNG you write and check it: the drawing sits exactly on Onyx's box (no offset, no
squash, no double painting of Onyx's own part under the drawing), colours match the theme, the
fallback looks like plain Onyx, nothing overflows at phone width, and the frames show the motion
you meant (compare at least one frame with the plain-Onyx reference row). Say in your report what
you looked at and what you fixed because of it.

## Commands

```sh
bun install
bun run build:tokens
ANIMA_DIR=~/.cache/golem/anima-8ffd7148 bun run build:anima   # a clean clone at the pinned commit
node ~/.cache/golem/anima-8ffd7148/packages/cli/src/main.ts validate <file.animl>
bun run typecheck && bun run test && bun run sizes
GOLEM_E2E_PORT=<your port> bunx playwright test e2e/<name>.spec.ts
```

AniML reference: `spec/SPEC.md`, `spec/ANIML.md`, `docs/AUTHORING.md` and `docs/WEB.md` in the
Anima checkout. The Switch (`components/switch/`) is the worked example. Known Anima issues and
their workarounds: `docs/anima-findings.md`; add any new one there (Golem never edits Anima).
