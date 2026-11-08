# Work log

## Now
Goal (owner 2026-11-08): every component in docs/components.md's catalogue, each milestone validated with screenshots and state tests, then proven to the owner.
State: branch integrate/components = main + PRs #9 ranges, #10 choice, #11 indicators, #12 disclosure, with review fixes; full e2e running on it. actions agent still running.
Next: review each agent PR with the protocol below as it arrives; merge one at a time; then the full suite + gallery + sheets on main, and a proof page for the owner (an artifact: per component its sheet, test counts per browser, size line).
Don't: commit .anima/, release/ or .cache/; edit Anima/Onyx/@bedrock/ui; involve Harmony; push a v* tag without the owner; let agents merge.

## Agents
GPT-6.1-sol, xhigh, via T3 delegate_task (worktree, branch `comp/<group>`, PR, no merge). Briefs: session scratchpad briefs/<group>.md (= docs/components.md + setup + rules + done). Their notes: worklog/<group>.md on their branch. A completion wakes me; never poll.

| Group | Components | Port | PR | Status |
| --- | --- | --- | --- | --- |
| choice | Checkbox, RadioGroup, Toggle | 4641 | #10 | reviewed; Toggle fill → growing circle (square corners mid-growth) |
| actions | Button, Spinner, Progress, Meter | 4642 | — | running |
| indicators | Tabs, ToggleGroup, SectionSelect | 4643 | #11 | reviewed; its finding renumbered F10 |
| ranges | Slider, PasswordField | 4644 | #9 | reviewed; eye redrawn on Codicon geometry + blink; slider frames cropped |
| disclosure | Collapsible, Accordion, Toast, Alert | 4645 | #12 | reviewed; no changes |

## Review protocol (per agent PR)
1. Read the PR description and diff; reject shared-code changes that aren't minimal and additive.
2. Check out the branch; `ANIMA_DIR=~/.cache/golem/anima-8ffd7148 bun run build:anima`; typecheck, unit, sizes.
3. Run its specs + e2e/switch.spec.ts myself (GOLEM_E2E_PORT 4631, my port). Timeouts under load: rerun before calling it a failure.
4. Regenerate its gallery + frames, `bun scripts/contact-sheet.ts <ids>`, look at each sheet.png; open originals for anything suspicious, and measure (getBoundingClientRect inside the shadow root) before believing a pixel offset.
5. Thin or doubtful PR: an independent GPT-6.1-sol reviewer that gets the code and sheets, not the author's summary.
6. Fix small findings myself; send big ones back to the agent's thread. Merge; resolve the one-line conflicts; update the table and Log.

## Open decisions (owner)
- First release tag v0.1.0 (publishes a GitHub release): waiting for a yes.
- Decided (me, 2026-11-08): Anima's `bind` module is allowed repo-wide for measured geometry (Tabs/ToggleGroup/SectionSelect). Runtime core+web+bind = 22.60 KB gz, still inside Anima's own 24 KB core+web gate. Everything else stays core.

## Gotchas
- Harmony and derived dark modes are out of scope; dark themes, including custom ones, are authored by hand. — owner instruction 2026-11-08
- Bun uses the isolated linker: `@mroiban/golem` is linked only into demo/node_modules, not the root node_modules; scripts import package source by path. — `ls demo/node_modules/@mroiban`
- `@mroiban/onyx` must be a release-tarball URL dependency; as a peer `*` Bun looks it up on npm and gets a 404. — bun install error
- Anima core conditions use `!name`, not `not name` (`not` needs the bind/derive modules); rounded rect `corners` need the `paint` module. Paths and circles are core. — anima validate on the scratch switch.animl
- AniML document colour slots are `<color name="x" value="#hex"/>` (no `<colors>` wrapper). They render as `var(--anima-x, default)` and cannot be animated (SPEC §6). — anima validate; spec/SPEC.md:239
- Each `packages/web/dist/anima-*.js` in Anima is a standalone bundle that includes core. Measure a module's cost against anima-icon.js (21.1 KB gz), not its standalone size. — gzip sizes
- The machine is shared (load average 50–70 from other agents): use Playwright with 2 workers, a 180 s webServer timeout and 45 s waits for the runtime. — e2e timeouts, `uptime`
- `<anima-icon>` sizes its SVG to w/grid × h/grid of the host, which squashes non-square scenes. Golem injects a fill style into the shadow root (findings F1). — svg measured 31.0×9.6 in a 31.5×17.5 host
- Onyx's Field `id` is not the wrapper div's id; select switches by data-testid or role. — e2e selector failure
- Firefox reports a failed dynamic import as a console *warning*: "Loading failed for the module …". — e2e log
- Grid and flex items stretch a Golem wrapper (seen on `.golem-switch`), and the overlay fills the wrapper, so wrappers must be `width/height: max-content` with `justify-self: start`. — screenshot showed stretched pills; e2e now asserts wrapper box == button box
- Never define a wrapper component inside another component's render (the demo's `Wrap`): it remounts the whole tree on every render. — caught before running the e2e live-theme test
- Don't name a Golem file `anima.json`: the Anima CLI reads any anima.json above a source file as its project config and fails ("unknown project field"). The pin is `anima-pin.json`. — build-anima failure
- The local ../anima checkout moves under another agent (seen at p7 05f37885 and 6b5a4245); build-anima warns when it isn't at the pin. For pin-exact local builds, use a clean clone: `git clone https://github.com/MRoiban/anima` + `npm ci --ignore-scripts`. — build-anima warning
- `bun test <word>` is a path *filter*, not a directory: `bun test packages` also ran Anima's tests in CI's ./anima checkout. Use `bun test ./packages/`. — CI run 42468759108
- GitHub release downloads (the Onyx tarball) returned 504 for over an hour on 2026-11-08, while the API asset download worked. CI's scripts/ci-install.sh falls back to `gh api` and checks the sha512 against bun.lock. A cache saved on a PR branch is not visible to other PRs, so the cache alone doesn't help. — CI runs 42466033831, 42468553844, 42469148126; local fallback test
- `bun run pack` reads packages/golem/package.json from git HEAD, not the working copy: CI's install fallback rewrites the Onyx URL to a local `file:` path, which must never ship. Commit manifest changes before packing. — scripts/ci-install.sh line 24
- The release tarball's runtime must come from the pin: pack refuses otherwise (`--allow-unpinned` for local tries; the local ../anima moves). — pack output "NOT the pin" at 2efbf239
- Parallel agents need distinct Playwright ports: GOLEM_E2E_PORT (default 4621); and a pinned Anima checkout outside ../anima, which moves: ~/.cache/golem/anima-8ffd7148 (clean clone + npm ci). — this session
- Bun's CSS bundler hoists @import-ed layer blocks above the file's own `@layer a, b;` statement; pack.ts restates the order at the top of dist/styles.css. — bun build of styles.css

- Playwright element screenshots at half-pixel positions look shifted by up to ~1 CSS px: the switch frames looked offset right, but wrapper, button, overlay and shadow SVG all measured 935.5,343.75,31.5×17.5. Measure before "fixing" alignment. — .cache/measure.ts
- A Playwright script outside the repo (e.g. in the scratchpad) resolves Bun's global playwright-core 1.65, whose browsers aren't installed; run ad-hoc scripts from the repo (.cache/ is gitignored). — "Executable doesn't exist … chromium_headless_shell-1254"

- Integrating parallel component branches: merge them all into one branch; conflicts are only list files: keep both sides; rewrite demo/sections/index.ts in catalogue order (a single conflict there spans imports and the array); dedupe catalogue rows in docs/components.md by hand; renumber clashing anima-findings IDs. — integrate/components
- Agents' frames specs tend to screenshot the whole row, so motion is invisible on the sheet: ask for crops around the moving part at ≥6× (slider fix). — PR #9 review

## Log
- 2026-11-08 09:36 [claude]: survey + scaffold → core-only Switch scene prototype compiles (3,972 B .ani) and renders the stretch correctly (evidence: scratchpad/s/sheet.png via `anima render --sheet 8`).
- 2026-11-08 10:05 [claude]: tokens (Onyx parity + completeness, 27 tests), bridge, Switch, demo, e2e (38 tests, Chromium + Firefox), sizes script, docs → bridge 3.52 KB gz after moving the token tables out (was 6.11); runtime 20.70 KB gz core-only; switch.ani 0.80 KB gz; first mount 15.6 ms compile + 8.4 ms instantiate, cached 0.77 ms per control, 28 controls all drawn 393 ms after navigation start (evidence: bun scripts/sizes.ts; demo metrics, Chromium)
- 2026-11-08 10:40 [claude]: e2e 38 pass / 14 skipped (screenshots spec without SHOTS) after the Firefox 404 wording fix and longer timeouts; fixed the grid-stretch bug found in the screenshots; final sizes: bridge 3.52, Switch 0.64, CSS 0.75 + 2.59 + 0.55, runtime 20.70, app-UI total 26.96 KB gz (evidence: e2e2.log, bun run sizes)
- 2026-11-08 10:50 [claude]: PR #1 CI green → merged (79f6ba4); reported to the owner
- 2026-11-08 11:20 [claude]: owner decisions applied on flexoki-theme → e2e 46 pass (incl. ?provider=off in Chromium + Firefox), bridge 3.68 KB gz, golem.css 2.73 KB gz with 6 themes; Flexoki screenshots reviewed (evidence: e2e3.log, bun run sizes)
- 2026-11-08 11:20 [claude]: PR #2 CI failed 3× on GitHub 504/5xx downloading Bun and the Onyx release tarball; reproduced locally with curl (504), so not a code problem → retry later
- 2026-11-08 11:45 [claude]: Anima public → anima-pin.json (8ffd714), CI checks out the pin + full e2e; built from a clean clone at the pin: switch.ani 823 B gz, runtime 21,196 B gz, identical to p7 (evidence: build-anima with ANIMA_DIR=clone)
- 2026-11-08 12:00 [claude]: PR #4 merged; CI on the pinned Anima 8ffd7148: build-anima ok, e2e 46 passed / 18 skipped (screenshots spec only) (evidence: CI log of b03729a)
- 2026-11-08 12:20 [claude]: CI install fallback (scripts/ci-install.sh) → tested locally against the real 504: the API download's hash matches bun.lock and Onyx installs (evidence: scratch copy run)
- 2026-11-08 19:10 [claude]: merged the 3 workspace packages into packages/golem (@mroiban/golem, subpaths . /anima /tokens + CSS) and added pack/smoke/tag-release → typecheck ok, 36 unit, 46 e2e pass, tarball 46.4 KB, smoke (tsc strict without skipLibCheck, Bun.build, SSR) ok incl. ONYX_TGZ override; main entry 3.90 KB gz (evidence: bun run sizes, bun run smoke)
- 2026-11-08 19:40 [claude]: PR #6 merged (single package; CI: pack from pin 8ffd7148, smoke ok, 46 e2e). component-kit groundwork → Switch e2e 46/46 on ?c=switch, gallery writes docs/screenshots/switch/*.png (looked at light.png: correct)
- 2026-11-08 19:55 [claude]: PR #7 merged (9413be7, CI green); 5 agents delegated (groups above). Dream: Now rewritten (was pre-merge), linker gotcha corrected (packages/components no longer exists), old milestone-1 screenshots at docs/screenshots/*.png stay; per-component ones go in docs/screenshots/<id>/
- 2026-11-08 20:10 [claude]: workflow adapted: scripts/contact-sheet.ts (one sheet.png per component: 6 themes, fallback, phone, frames); switch frames moved to docs/screenshots/switch/frames-*.png, milestone-1 top-level PNGs removed (superseded by the gallery); WORKLOG restructured (Agents table, Review protocol, Open decisions). Switch sheet reviewed: all themes and fallback correct; apparent 1 px frame offset is screenshot rounding (measured)
- 2026-11-08 21:00 [claude]: reviewed PRs #9–#12 (descriptions, shared-file diff, sheets, full-size frames); fixes: PasswordField eye on Codicon geometry with blink (76/76 ranges e2e), slider frames cropped, Toggle growing circle; merged all four into integrate/components; static checks pass: 13 components, JS 8.34 KB, CSS 1.26 KB, runtime+bind 22.60 KB, app-UI 43.49 KB gz
