# Work log

## Now
Goal: first milestone (design doc, tokens, bridge, Switch + demo + e2e), then report to the owner.
State: all code written, uncommitted. Unit tests 30 pass, typecheck clean; e2e 36/38 on the first full run (2 fixed since: the Firefox 404 message wording, and load-related timeouts); sizes within budget. docs/design.md, anima-findings.md and proposals.md are written. Screenshots spec exists (SHOTS=1).
Next: confirm the full e2e run is green and look at the screenshots; commit the scaffold to main and push; put the rest on branch m1-switch and open a PR; merge when CI is green; report.
Don't: edit other repos; commit .anima/ or compiled .ani; add a licence; involve Harmony.

## Gotchas
- Harmony and derived dark modes are out of scope; dark themes, including custom ones, are authored by hand. — owner instruction 2026-11-08
- Bun uses the isolated linker here: workspace packages are linked under packages/*/node_modules, not under root node_modules/@golem. — `ls packages/components/node_modules/@golem`
- `@mroiban/onyx` must be a release-tarball URL dependency; as a peer `*` Bun looks it up on npm and gets a 404. — bun install error
- Anima core conditions use `!name`, not `not name` (`not` needs the bind/derive modules); rounded rect `corners` need the `paint` module. Paths and circles are core. — anima validate on the scratch switch.animl
- AniML document colour slots are `<color name="x" value="#hex"/>` (no `<colors>` wrapper). They render as `var(--anima-x, default)` and cannot be animated (SPEC §6). — anima validate; spec/SPEC.md:239
- Each `packages/web/dist/anima-*.js` in Anima is a standalone bundle that includes core. Measure a module's cost against anima-icon.js (21.1 KB gz), not its standalone size. — gzip sizes

- The machine is shared (load average 50–70 from other agents): use Playwright with 2 workers, a 180 s webServer timeout and 45 s waits for the runtime. — e2e timeouts, `uptime`
- `<anima-icon>` sizes its SVG to w/grid × h/grid of the host, which squashes non-square scenes. Golem injects a fill style into the shadow root (findings F1). — svg measured 31.0×9.6 in a 31.5×17.5 host
- Onyx's Field `id` is not the wrapper div's id; select switches by data-testid or role. — e2e selector failure
- Firefox reports a failed dynamic import as a console *warning*: "Loading failed for the module …". — e2e log

## Log
- 2026-11-08 09:36 [claude]: survey + scaffold → core-only Switch scene prototype compiles (3,972 B .ani) and renders the stretch correctly (evidence: scratchpad/s/sheet.png via `anima render --sheet 8`).
- 2026-11-08 10:05 [claude]: tokens (Onyx parity + completeness, 27 tests), bridge, Switch, demo, e2e (38 tests, Chromium + Firefox), sizes script, docs → bridge 3.52 KB gz after moving the token tables out (was 6.11); runtime 20.70 KB gz core-only; switch.ani 0.80 KB gz; first mount 15.6 ms compile + 8.4 ms instantiate, cached 0.77 ms per control, 28 controls all drawn 393 ms after navigation start (evidence: bun scripts/sizes.ts; demo metrics, Chromium)
