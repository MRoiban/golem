# Anima findings

Bugs, gaps and missing APIs that Golem hit while using Anima, for Anima's owner. Golem does not
edit Anima; each item lists Golem's workaround. First measured against Anima `05f37885` (p7 branch, 2026-11-08).

Status re-checked at Anima `c2b870ae` (main, 2026-11-09), the commit Golem now pins. Anima's issues
#23–#30 answered F1–F8; F9–F11 remain open.

| # | Kind | Summary | Status at `c2b870ae` | Golem now |
| --- | --- | --- | --- | --- |
| F1 | Bug | Non-square viewBox scenes are drawn squashed | Fixed (#23): uniform scale by the long axis | Still overrides placement to fill the box, through `::part(svg)` (see F1) |
| F2 | Bug / doc | `set()` / `fire()` before the player exists are dropped silently | Fixed (#24): writes queue in order | Waits for `anima:load` only to report "ready" |
| F3 | Missing API | No way to start a scene at rest in its current state | Fixed (#25): `settle()` | Uses `settle()` on mount |
| F4 | Gap | Colour slots cannot animate or mix | Addressed (#26): optional `colormix` module | Keeps the two-shape cross-fade, to stay core-only |
| F5 | Missing API | No styling hook for the shadow SVG | Fixed (#27): `part="svg"` | Styles `anima-icon::part(svg)`; no shadow injection |
| F6 | Missing tool | No supported way to build one bundle with chosen modules | Fixed (#28): `anima bundle --modules` | `build-anima.ts` uses it |
| F7 | Authoring trap | Core guards use `!x`, bind expressions use `not x` | Addressed (#29): validator hint | Nothing needed |
| F8 | Cost | Rounded-rect `corners` need the `paint` module | Addressed (#30): `corners` is its own module | Keeps paths and circles (core) |
| F9 | Bug | Partial stroke trim repeats a round-cap dot at the far endpoint | Open ([anima#39](https://github.com/MRoiban/anima/issues/39)): same dash arrays (`9.18642 5.31581`) | Workarounds unchanged |
| F10 | Bug | SVG matrix rounding collapses tiny reciprocal transforms | Open ([anima#40](https://github.com/MRoiban/anima/issues/40)): `scaleX="0.000001"` still renders `matrix(0 0 0 1 0 0)` | Workaround unchanged |
| F11 | Gap | Numeric bindings have no temporal smoothing | Partly: the `convert` module's `interpolate` (with `ease`) smooths a binding, but needs `data` + `convert`: runtime 24.7 → 36.0 KB gz, over Golem's 32 KB budget | Keeps the 240 ms JS interpolation |

Repros for F9 and F10 at both pins: render a one-path scene with `anima render <file> -o out.svg` and
read `stroke-dasharray` / `transform` (scenes in the F9 and F10 sections below).

## F1. Non-square viewBox scenes are drawn squashed

`packages/web/src/index.ts:582` sizes the SVG inside the host as
`width: w/grid·100%` and `height: h/grid·100%`, while the host keeps `aspect-ratio: w/h`. When the
viewBox is not square, each axis gets a different scale.

Evidence: Golem's switch (`grid="32" viewBox="0 0 31.5 17.5"`) in a 31.5×17.5 px host drew its SVG
at 31.0×9.6 px (Chromium, `getBoundingClientRect`). The track came out 55 % of its height.

Workaround: Golem appends `svg{left:0;top:0;width:100%;height:100%}` (all `!important`) to each
icon's shadow root after load (`AnimaControl.tsx`). anima-kit needed a similar injected style
(`OVERLAY_FIX`, for pointer events). It is fragile, because a reload rebuilds the shadow root.

Proposal: size by the viewBox (`width: 100%`, `height: 100%` of a host whose aspect is w/h), and keep
grid offsets for bleed only. Or add `fit="stretch"` / a `part="svg"` (see F5).

**At `c2b870ae`:** fixed. Both axes now share one scale, set by the viewBox's long axis over `grid`.
Golem still wants "fill the part's box": with that placement the switch (`grid="32"`, viewBox
31.5 wide) draws 31.0×17.2 in a 31.5×17.5 host, and Progress/Meter (stretched to the bar) draw
21.7 px tall in a 6 px bar. Golem sets the placement with `.golem-anima > anima-icon::part(svg)`
in `styles.css` (F5's hook); all 81 playground drawings then measure exactly their host box.

## F2. `set()` / `fire()` before the player exists are dropped silently

`set(name, value)` is `this.player?.set(...)` (`index.ts:509`). `docs/WEB.md` says writes are
"queued … applied on the next step". That holds once a player exists. Before any load, or after `loadModel()` if its finish is
deferred (`index.ts:80-100` finishes through a callback), a write is lost without any diagnostic.

Workaround: Golem awaits `anima:load` when `icon.player` is still undefined, then writes its inputs.

Proposal: queue host writes until the player exists, or document the window and warn in verbose
builds.

**At `c2b870ae`:** fixed; writes queue in order and apply before the first step.

## F3. No way to start a scene at rest in its current state

A control that mounts already "on" should appear on, not animate in from its initial state. The
host has no API for this. Golem writes the inputs, then calls `icon.player.step(0)`,
`icon.player.step(5)` and `icon.invalidate()`. `player` is documented as "for debugging", and direct
steps bypass host playback.

Proposal: `icon.settle()` (resolve every blend and once-timeline at the current inputs, without
events), or `set(name, value, { instant: true })`.

**At `c2b870ae`:** fixed; `AnimaControl` calls `settle()`. The tone icon still uses
`player.step(0)` + `invalidate()` after firing its draw-in, which Anima documents for applying
pending changes at once (`settle()` would finish the timeline).

## F4. Colour slots cannot animate or mix

SPEC §6: slots are not animatable, and the `mix()` of two theme colours needs the data and bind
modules plus the Theme model. Golem's switch therefore stacks two track paths (off, on) and
cross-fades their opacity. That works, but it costs a node per colour state, and a three-colour
transition would need three nodes.

Proposal: allow `mix(slotA, slotB, t)` paints in core, rendered as two stacked fills or with CSS
`color-mix()`.

**At `c2b870ae`:** an optional `colormix` module. Golem's cross-fades work in core, so it stays there.

## F5. No styling hook for the shadow SVG

There is no `::part()` and no host attribute for "fill the box", so any layout fix has to inject a
`<style>` into the shadow root (F1). anima-kit did the same for pointer events.

Proposal: `part="svg"` on the SVG element.

**At `c2b870ae`:** fixed; Golem uses `anima-icon::part(svg)`.

## F6. No supported way to build one bundle with chosen modules

Each `packages/web/dist/anima-*.js` is a standalone bundle that includes core, so a page that needs
two modules cannot load two dist files. Golem builds its runtime with Anima's internal
`tools/browser-build.ts` `bundle()` (esbuild, terser and the terse-flags plugin), used read-only
from a checkout. That is an internal API that could change without notice.

Proposal: `anima bundle --modules paint,bind -o anima.js`, or publish the module entries as ESM
that share one core chunk.

**At `c2b870ae`:** fixed; `scripts/build-anima.ts` runs `anima bundle --modules`.

## F7. Core guards use `!x`, bind expressions use `not x`

Core state guards accept `!name` and `&&`. anima-kit's scenes use `not $kit:on`, which only
validates with the bind/derive expression modules. A scene author moving between the two hits
`bad-condition`. The validator hint (`terms: name, !name, … joined with &&`) is good. This is only
worth noting in AUTHORING.md.

## F8. Rounded-rect `corners` need the `paint` module

A pill-shaped track with `<rect corners>` requires `paint` (budget 4.4 KB). The same shape as a
`<path>` with arcs is core. Golem uses paths and circles so its switch scene needs no optional
module (runtime 20.7 KB gz).

## Notes for anima-kit (not Anima)

- `kit/build.py` and `kit/onyx_common.py` point the Anima CLI and Codicons at another session's
  scratchpad (`/tmp/claude-1000/...`). The build only works on that machine and session.
- `web/vendor/anima.js` (318 KB, 30 modules) is a vendored runtime. Golem builds its own
  from a checkout instead (`scripts/build-anima.ts`).

## F9. A partial trimmed stroke leaves a round-cap dot at the far endpoint

Measured at the pinned `8ffd7148`. PasswordField's slash (`M1.5 1.5L10.5 10.5`, width 1,
round caps) showed a detached dot at (10.5,10.5) while `trimEnd` was between 0 and 1.
Evidence: `docs/screenshots/password-field/trim-artifact.png`, the original 40 ms close frame.
`packages/core/src/svg.ts:147` emits dash lengths `[fraction × length, (1−fraction) × length]`:
the next repeated dash begins exactly at the endpoint, and its round cap paints a dot there.

Workaround: Golem grows a horizontal slash with `scaleX` from 0 to 1 inside a 45° rotated
group. It keeps constant transverse stroke width, has a single growing tip, and needs core only.
Proposal: for a non-wrapping trim, use a gap longer than the remaining path so the dash cannot
repeat at the far endpoint.
### Additional Button evidence and workaround

At pin `8ffd7148`, the SVG renderer rounds `stroke-dasharray` lengths to five decimals. For
Button's check (`M2 7L5.5 10.5L12 3.5`) at trimEnd `0.6334486808633097`, the dash array is
`9.18642 5.31581`: total `14.50223`, just below the real path length `14.502234055577233`.
The repeated dash starts again for a microscopic distance at the far endpoint; with a round
linecap this paints a visible detached dot. It appeared in the 40/80 ms success frames.

Workaround: flat caps on the check/cross (the join stays round), which makes the tiny repeated
fragment invisible. The final button frames were regenerated and reviewed. Proposal: use a
non-repeating gap longer than the perimeter, or retain enough precision that the trim cannot
repeat before the actual endpoint.

**At `c2b870ae`:** still open. This scene renders the same dash arrays at both pins,
`9.18642 5.31581` (path 14.50223) and `5.09117 7.63675` (path 12.72792):

```xml
<anima version="0.1" name="f9" grid="14" viewBox="0 0 14 14">
  <path id="check" d="M2 7L5.5 10.5L12 3.5" fill="#00000000" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" trimEnd="0.6334486808633097"/>
  <path id="slash" d="M1.5 1.5L10.5 10.5" fill="#00000000" stroke="currentColor" stroke-width="1" stroke-linecap="round" trimEnd="0.4"/>
</anima>
```

## F10. SVG transform quantization can collapse reciprocal geometry transforms
Measured against pinned `8ffd7148`: the web SVG renderer serializes a scale of `0.000001` as
`matrix(0 0 0 1 0 0)`, although `Player.values()["xUnits.scaleX"]` still reports `0.000001`.
A nested inverse scale of `1000000` cannot recover the lost geometry: the initial indicator is
invisible. The indicators use reciprocal transforms to let core timelines travel across a
numeric distance supplied by bind. Quantize measured distances to 0.001 px before inversion to avoid amplifying renderer rounding.
For near-zero-distance axes, use `0.001` (inverse `1000`), which
survives serialization and introduces only 0.001 px of movement on that axis. Numeric inputs
remain the source of geometry; no JavaScript tweening or runtime modification is needed.
Related authoring clarification: `<rect rx="…">` is core and can bind `rx`; the extended
`corners` syntax in F8 requires paint. Indicators use core `rx` to match Onyx's measured radius.

**At `c2b870ae`:** still open. `anima render` of this scene gives `matrix(0 0 0 1 0 0)` for
`units` at both pins:

```xml
<anima version="0.1" name="f10" grid="16" viewBox="0 0 16 16">
  <group id="units" scaleX="0.000001"><group id="undo" scaleX="1000000"><path id="r" d="M2 2H14V14H2Z" fill="currentColor"/></group></group>
</anima>
```

## F11. Numeric bindings have no temporal smoothing operator

At pin `8ffd7148`, SPEC's bind chapter permits input arithmetic, comparisons and `mix`, but no
property reads, elapsed time, or smoothing. A `<bind target="fill.scaleX" value="level"/>` changes
immediately on the next player step; bindings run after layers and override a blend on that address
(SPEC §7.4). Core poses and timeline keys accept literal numbers, so they cannot ease an arbitrary
new numeric input without another mechanism.

Evidence: Progress and Meter compile with `requires="bind"`; their DOM value tests cover fractional
ranges and live ARIA updates. Golem's workaround is a local, interruptible 240 ms interpolation of
the DOM-derived drawing input, using Onyx's emphasis cubic. Anima binds that input to geometry and
owns the tone opacity blends and indeterminate sweep. This adds only bind to the runtime
(23,139 B gz versus 21,196 B core-only), within the 32 KB module budget. Initial and fallback values
settle directly, and the interpolation cancels on unmount or motion changes.

Proposal: a binding smoothing modifier (duration + easing), with a current-value snapshot when
interrupted and an explicit settle path for initial rendering.

**At `c2b870ae`:** partly. The `convert` module's `interpolate` converter (`duration` in ms,
optional `ease`, retargets from the current sample) smooths a binding, but it reads data paths:
a scene needs `requires="data bind convert"`. Golem's runtime would grow from 24.7 to 36.0 KB gz
(`anima bundle --modules bind,data,convert`), over its 32 KB budget, to replace about 30 lines of
JavaScript. Golem keeps the local interpolation; a core or bind-only smoothing would let it go.
