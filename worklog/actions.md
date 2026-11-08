# Actions implementation

Branch comp/actions; binding actions brief, port 4642 and 2 workers. No edits to shared bridge,
hooks, helpers, scripts or WORKLOG. Scenes built from clean pinned Anima 8ffd7148.

## Geometry and state
- Onyx loading keeps label visible beside its spinner. Replace only that slot, measured with
  layout offsets (not transformed bounding boxes). Results fade the label's paint, keeping the
  accessible name and layout, and center a check/cross in the reserved area. A persistent polite
  live region announces results in every motion mode. Native-size result labels need a box
  (display:contents cannot fade); never hide them with visibility:hidden (loses accessible name).
- Portal drawings into Onyx's element/actual track: inherits currentColor, handles meter headers
  and avoids guessed padding. CSS press squash moves the actual Button box and text together.
- Memoize Onyx Button against decorative-only renders: Onyx measures loading width with
  getBoundingClientRect(), so a press-state rerender could snapshot the .97 transform. Caller
  props still pass through. The E2E width assertion caught the 1px shrink.
- Spinner size poses normalize radii/stroke widths: xs 10/1.5px; sm 12/2; md 14/2; lg 20/2.
- Progress/Meter read DOM ARIA values and data-tone only. A local interruptible 240ms emphasis
  interpolation feeds numeric AniML bind. CSS clipping rounds the eased fill edge to match Onyx.
  Anima owns the geometry, tone fades and indeterminate sweep (1.12s).

## Anima findings and test gotchas
- F10: numeric bind has no smoothing/operator or animated property reads; bindings override blends.
  Local input interpolation is the workaround; bind adds 1,943 B gz to core-only runtime.
- F9: five-decimal trim dash rounding leaves a repeated micro-dash and round-cap dot at the far
  endpoint of an open path. Flat caps on result glyphs fix it (round join retained).
- AniML no-fill is #00000000, not SVG `none`. Player values use canonical `check.stroke.trimEnd`.
- Shared .golem-part__motion is emitted after component imports: component positioning selectors
  need more specificity to override inset:0. Initial visual review caught the top-left spinner.
- Compare offsetWidth for rotating/pressed elements; bounding boxes include the rotation/squash.
- In clock tests pauseAt(Date.now()+1000), not the runner's Date (can be in the mocked past).
  Yield between virtual RAFs so React commits before Anima inputs are read. Deterministic frame
  tests reset paused debug players to a known phase, then reapply DOM inputs (test-only F3).
- After interrupting Playwright allow its server to exit; immediate restart can hit port in use.

## Evidence
- Pinned scene build + typecheck pass; 36 unit tests pass; all size budgets pass.
- Sizes gz: Button 953 B; Spinner 662 B; Progress 1002 B; Meter 999 B. Runtime bind 23,139 B;
  bridge 3.68 KB, all JS 5.42 KB, CSS .91 KB, app total 33.82 KB.
- Gallery/frames: 12 pass Chromium, plus 4 focused state/interrupt/frame tests after fixes.
  Reviewed all 59 PNGs via contact sheets and individual light galleries; regenerated and reviewed
  Button frames after F9. Six themes each, fallback, phone, Button result/press frames, Spinner
  turns, Progress value frames, Meter value/tone frames. No clipping/overflow/double paint left.
- Final full run: 208 passed (7.0m), 104 Chromium + 104 Firefox. Per browser: Button 20,
  Spinner 19, Progress 21, Meter 21, Switch regression 23. No failures or skips.
- Focused Button width/result regression after memoization: 2 passed (Chromium + Firefox).
- Final Button gallery refresh after memo/cap fixes: 8 passed; all six themes, fallback and phone
  regenerated and reviewed.
- Final scene optimization: hidden Button spin and determinate bar sweep layers stop at idle;
  added assertions and reran the full browser matrix before pushing.

## Integration with current main
- PR https://github.com/MRoiban/golem/pull/13 opened; main had merged ranges and the review workflow.
  Resolved registry/import conflicts preserving both groups. The ranges F9 finding is the same trim
  dot: retained its number and evidence, added Button's rounding evidence; numeric smoothing is F10.
- Built and opened four repository contact sheets (63 reviewed PNGs total). Pinned build,
  typecheck, 36 units and sizes pass with main: all JS 6.23 KB, CSS 1.07 KB, app total 36.10 KB gz.
- Integrated matrix: 208 actions + Switch browser tests passed (4.7m), 104 per browser;
  no failures/skips. All four committed contact sheets opened and reviewed.
