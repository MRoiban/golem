# Work log

## Now
Goal: Anima is public (owner, 2026-11-08): pin it and run the full suite in CI. Package naming is still open (ideas given to the owner).
State: branch anima-public: anima-pin.json (main 8ffd714), CI checks out the pin and runs build:anima + full e2e (Chromium + Firefox); docs updated. Built against the pin locally: identical output (runtime 21,196 B gz).
Next: PR, merge when CI is green.
Don't: commit .anima/ or compiled .ani; edit Anima/Onyx/@bedrock/ui; involve Harmony.

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

- Grid and flex items stretch the `.golem-switch` wrapper, and the overlay fills the wrapper, so the wrapper must be `width/height: max-content` with `justify-self: start`. — screenshot showed stretched pills; e2e now asserts wrapper box == button box

- Never define a wrapper component inside another component's render (the demo's `Wrap`): it remounts the whole tree on every render. — caught before running the e2e live-theme test

- Don't name a Golem file `anima.json`: the Anima CLI reads any anima.json above a source file as its project config and fails ("unknown project field"). The pin is `anima-pin.json`. — build-anima failure
- The local ../anima checkout moves under another agent (seen at p7 05f37885 and 6b5a4245); build-anima warns when it isn't at the pin. For pin-exact local builds, use a clean clone: `git clone https://github.com/MRoiban/anima` + `npm ci --ignore-scripts`. — build-anima warning

- `bun test <word>` is a path *filter*, not a directory: `bun test packages` also ran Anima's tests in CI's ./anima checkout. Use `bun test ./packages/`. — CI run 42468759108
- GitHub release downloads (the Onyx tarball) returned 504 for a while on 2026-11-08; CI now caches ~/.bun/install/cache and retries bun install. — CI runs 42466033831, 42468553844

## Log
- 2026-11-08 09:36 [claude]: survey + scaffold → core-only Switch scene prototype compiles (3,972 B .ani) and renders the stretch correctly (evidence: scratchpad/s/sheet.png via `anima render --sheet 8`).
- 2026-11-08 10:05 [claude]: tokens (Onyx parity + completeness, 27 tests), bridge, Switch, demo, e2e (38 tests, Chromium + Firefox), sizes script, docs → bridge 3.52 KB gz after moving the token tables out (was 6.11); runtime 20.70 KB gz core-only; switch.ani 0.80 KB gz; first mount 15.6 ms compile + 8.4 ms instantiate, cached 0.77 ms per control, 28 controls all drawn 393 ms after navigation start (evidence: bun scripts/sizes.ts; demo metrics, Chromium)
- 2026-11-08 10:40 [claude]: e2e 38 pass / 14 skipped (screenshots spec without SHOTS) after the Firefox 404 wording fix and longer timeouts; fixed the grid-stretch bug found in the screenshots; final sizes: bridge 3.52, Switch 0.64, CSS 0.75 + 2.59 + 0.55, runtime 20.70, app-UI total 26.96 KB gz (evidence: e2e2.log, bun run sizes)
- 2026-11-08 10:50 [claude]: PR #1 CI green → merged (79f6ba4); reported to the owner
- 2026-11-08 11:20 [claude]: owner decisions applied on flexoki-theme → e2e 46 pass (incl. ?provider=off in Chromium + Firefox), bridge 3.68 KB gz, golem.css 2.73 KB gz with 6 themes; Flexoki screenshots reviewed (evidence: e2e3.log, bun run sizes)
- 2026-11-08 11:20 [claude]: PR #2 CI failed 3× on GitHub 504/5xx downloading Bun and the Onyx release tarball; reproduced locally with curl (504), so not a code problem → retry later
- 2026-11-08 11:45 [claude]: Anima public → anima-pin.json (8ffd714), CI checks out the pin + full e2e; built from a clean clone at the pin: switch.ani 823 B gz, runtime 21,196 B gz, identical to p7 (evidence: build-anima with ANIMA_DIR=clone)
