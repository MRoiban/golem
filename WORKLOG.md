# Work log

## Now
Goal: apply the owner's decisions (2026-11-08): MIT licence; Flexoki as the first real custom theme; pebbles get motion with no code changes; package scope undecided.
State: branch flexoki-theme (stacked on worklog-m1 = PR #2): MIT LICENSE; flexoki/flexoki-dark themes; provider-free useGolem(); meta-tag runtime discovery; demo ?provider=off; docs updated. Unit 36 pass, typecheck clean, e2e 46 pass. PR #2's CI is failing on GitHub release downloads (HTTP 504 from GitHub, also reproduced locally).
Next: open the PR from flexoki-theme; merge PR #2 and then this one when CI recovers; report.
Don't: edit @bedrock/ui or Bedrock (the "no code changes" work there is in docs/proposals.md); commit .anima/; involve Harmony.

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

## Log
- 2026-11-08 09:36 [claude]: survey + scaffold → core-only Switch scene prototype compiles (3,972 B .ani) and renders the stretch correctly (evidence: scratchpad/s/sheet.png via `anima render --sheet 8`).
- 2026-11-08 10:05 [claude]: tokens (Onyx parity + completeness, 27 tests), bridge, Switch, demo, e2e (38 tests, Chromium + Firefox), sizes script, docs → bridge 3.52 KB gz after moving the token tables out (was 6.11); runtime 20.70 KB gz core-only; switch.ani 0.80 KB gz; first mount 15.6 ms compile + 8.4 ms instantiate, cached 0.77 ms per control, 28 controls all drawn 393 ms after navigation start (evidence: bun scripts/sizes.ts; demo metrics, Chromium)
- 2026-11-08 10:40 [claude]: e2e 38 pass / 14 skipped (screenshots spec without SHOTS) after the Firefox 404 wording fix and longer timeouts; fixed the grid-stretch bug found in the screenshots; final sizes: bridge 3.52, Switch 0.64, CSS 0.75 + 2.59 + 0.55, runtime 20.70, app-UI total 26.96 KB gz (evidence: e2e2.log, bun run sizes)
- 2026-11-08 10:50 [claude]: PR #1 CI green → merged (79f6ba4); reported to the owner
- 2026-11-08 11:20 [claude]: owner decisions applied on flexoki-theme → e2e 46 pass (incl. ?provider=off in Chromium + Firefox), bridge 3.68 KB gz, golem.css 2.73 KB gz with 6 themes; Flexoki screenshots reviewed (evidence: e2e3.log, bun run sizes)
- 2026-11-08 11:20 [claude]: PR #2 CI failed 3× on GitHub 504/5xx downloading Bun and the Onyx release tarball; reproduced locally with curl (504), so not a code problem → retry later
