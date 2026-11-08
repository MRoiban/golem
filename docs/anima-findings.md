# Anima findings

Bugs, gaps and missing APIs that Golem hit while using Anima, for Anima's owner. Golem does not
edit Anima; each item lists Golem's workaround. Measured against Anima `05f37885` (p7 branch, 2026-11-08).

| # | Kind | Summary | Golem workaround |
| --- | --- | --- | --- |
| F1 | Bug | Non-square viewBox scenes are drawn squashed | Injects a style into the shadow root |
| F2 | Bug / doc | `set()` / `fire()` before the player exists are dropped silently | Waits for `anima:load` |
| F3 | Missing API | No way to start a scene at rest in its current state | Calls `icon.player.step()` directly |
| F4 | Gap | Colour slots cannot animate or mix | Two shapes and an opacity cross-fade |
| F5 | Missing API | No styling hook for the shadow SVG | Same as F1 |
| F6 | Missing tool | No supported way to build one bundle with chosen modules | Calls `tools/browser-build.ts` `bundle()` |
| F7 | Authoring trap | Core guards use `!x`, bind expressions use `not x` | None needed (the validator hint is clear) |
| F8 | Cost | Rounded-rect `corners` need the `paint` module | Uses paths and circles |
| F9 | Bug | SVG matrix rounding collapses tiny reciprocal transforms | Quantizes travel distances and clamps near-zero axes to 0.001 |

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

## F2. `set()` / `fire()` before the player exists are dropped silently

`set(name, value)` is `this.player?.set(...)` (`index.ts:509`). `docs/WEB.md` says writes are
"queued … applied on the next step". That holds once a player exists. Before any load, or after `loadModel()` if its finish is
deferred (`index.ts:80-100` finishes through a callback), a write is lost without any diagnostic.

Workaround: Golem awaits `anima:load` when `icon.player` is still undefined, then writes its inputs.

Proposal: queue host writes until the player exists, or document the window and warn in verbose
builds.

## F3. No way to start a scene at rest in its current state

A control that mounts already "on" should appear on, not animate in from its initial state. The
host has no API for this. Golem writes the inputs, then calls `icon.player.step(0)`,
`icon.player.step(5)` and `icon.invalidate()`. `player` is documented as "for debugging", and direct
steps bypass host playback.

Proposal: `icon.settle()` (resolve every blend and once-timeline at the current inputs, without
events), or `set(name, value, { instant: true })`.

## F4. Colour slots cannot animate or mix

SPEC §6: slots are not animatable, and the `mix()` of two theme colours needs the data and bind
modules plus the Theme model. Golem's switch therefore stacks two track paths (off, on) and
cross-fades their opacity. That works, but it costs a node per colour state, and a three-colour
transition would need three nodes.

Proposal: allow `mix(slotA, slotB, t)` paints in core, rendered as two stacked fills or with CSS
`color-mix()`.

## F5. No styling hook for the shadow SVG

There is no `::part()` and no host attribute for "fill the box", so any layout fix has to inject a
`<style>` into the shadow root (F1). anima-kit did the same for pointer events.

Proposal: `part="svg"` on the SVG element.

## F6. No supported way to build one bundle with chosen modules

Each `packages/web/dist/anima-*.js` is a standalone bundle that includes core, so a page that needs
two modules cannot load two dist files. Golem builds its runtime with Anima's internal
`tools/browser-build.ts` `bundle()` (esbuild, terser and the terse-flags plugin), used read-only
from a checkout. That is an internal API that could change without notice.

Proposal: `anima bundle --modules paint,bind -o anima.js`, or publish the module entries as ESM
that share one core chunk.

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

## F9. SVG transform quantization can collapse reciprocal geometry transforms

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
