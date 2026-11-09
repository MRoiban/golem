# Work log

## Now
Goal (owner 2026-11-08): every component in docs/components.md's catalogue, validated with screenshots and state tests, proven to the owner. Done: all 17 merged (PRs #9–#14); CI on main 844f6dc: 600 passed / 0 failed, pack 73.4 KB + smoke ok. Proof page: https://claude.ai/artifact/KQ5iRrXWqpe353iGeEoNzE (private; republish from the session scratchpad file, or pass the URL).
Playground (owner asked 2026-11-09, modelled on anima-kit's page): demo/play.tsx at /play, every component in a gallery with state readouts, Stress buttons, an event log and URL-kept settings. Live at https://golem.mc2.onl, a public Bedrock pebble deployed from ~/.cache/golem/pebble (outside the repo, so no bedrock dependency here): `bun run site`, copy release/site to that folder's site/, `bedrock deploy` there. The owner is using it to hunt bugs; their reports come next.
Anima pin bumped 8ffd7148 → c2b870ae (owner asked 2026-11-09: the big review-fix sweep, 194 fixes, plus issues #23–#35 that answered F1–F8). Golem now uses settle(), ::part(svg) and `anima bundle --modules`; F9–F11 still open at c2b870ae (docs/anima-findings.md has the table). Playground redeployed on it.
Released: v0.1.0 (2026-11-09), v0.1.1 (production JSX: v0.1.0's dist imported react/jsx-dev-runtime and crashed consumer production builds). Pebbles: bedrock#10 (owner go-ahead 2026-11-09) puts Golem in @bedrock/ui and serves the runtime per pebble at /_bedrock/anima/<version>/; work clone /data/playground/bedrock-golem; not deployed to the live daemon (~/.bedrock/src) — ask the owner first. Upgrading Golem in Bedrock = release URL in packages/ui/package.json, bun install, bun run build:css.
Next: WebKit (Safari) in CI; follow-up: move Progress/Meter fill easing from the JS interpolation into Anima (Tabs' reciprocal-transform technique, F10).
Don't: commit .anima/, release/ or .cache/; edit Anima/Onyx/@bedrock/ui; involve Harmony; push a v* tag without the owner; let agents merge.

## Agents
All 5 finished. GPT-6.1-sol, xhigh, via T3 delegate_task (worktree, branch `comp/<group>`, PR, no merge). Briefs: session scratchpad briefs/<group>.md (= docs/components.md + setup + rules + done). Their notes: worklog/<group>.md on their branch. A completion wakes me; never poll.

| Group | Components | Port | PR | Status |
| --- | --- | --- | --- | --- |
| choice | Checkbox, RadioGroup, Toggle | 4641 | #10 | merged via #14; Toggle fill → growing circle (square corners mid-growth) |
| actions | Button, Spinner, Progress, Meter | 4642 | #13 | merged via #14; finding renumbered F11; spinner frames re-shot at 8×; follow-up: Progress/Meter fill eases by a 240 ms JS interpolation (React re-renders), Tabs-style reciprocal transforms could move it into Anima |
| indicators | Tabs, ToggleGroup, SectionSelect | 4643 | #11 | merged via #14; its finding renumbered F10 |
| ranges | Slider, PasswordField | 4644 | #9 | merged; eye redrawn on Codicon geometry + blink; slider frames cropped |
| disclosure | Collapsible, Accordion, Toast, Alert | 4645 | #12 | merged via #14; Accordion/CollapsibleTrigger annotated (TS2742) |

## Review protocol (per agent PR)
1. Read the PR description and diff; reject shared-code changes that aren't minimal and additive.
2. Check out the branch; `ANIMA_DIR=~/.cache/golem/anima-c2b870ae bun run build:anima`; typecheck, unit, sizes.
3. Run its specs + e2e/switch.spec.ts myself (GOLEM_E2E_PORT 4631, my port). Timeouts under load: rerun before calling it a failure.
4. Regenerate its gallery + frames, `bun scripts/contact-sheet.ts <ids>`, look at each sheet.png; open originals for anything suspicious, and measure (getBoundingClientRect inside the shadow root) before believing a pixel offset.
5. Thin or doubtful PR: an independent GPT-6.1-sol reviewer that gets the code and sheets, not the author's summary.
6. Fix small findings myself; send big ones back to the agent's thread. Merge; resolve the one-line conflicts; update the table and Log.

## Open decisions (owner)
- Deploying bedrock#10 to the live daemon (restarts every pebble): waiting for a yes.
- Decided (me, 2026-11-08): Anima's `bind` module is allowed repo-wide for measured geometry (Tabs/ToggleGroup/SectionSelect). Runtime core+web+bind = 22.60 KB gz, still inside Anima's own 24 KB core+web gate. Everything else stays core.

## Gotchas
- Harmony and derived dark modes are out of scope; dark themes, including custom ones, are authored by hand. — owner instruction 2026-11-08
- Bun uses the isolated linker: `@mroiban/golem` is linked only into demo/node_modules, not the root node_modules; scripts import package source by path. — `ls demo/node_modules/@mroiban`
- `@mroiban/onyx` must be a release-tarball URL dependency; as a peer `*` Bun looks it up on npm and gets a 404. — bun install error
- Anima core conditions use `!name`, not `not name` (`not` needs the bind/derive modules); rounded rect `corners` need the `paint` module. Paths and circles are core. — anima validate on the scratch switch.animl
- AniML document colour slots are `<color name="x" value="#hex"/>` (no `<colors>` wrapper). They render as `var(--anima-x, default)` and cannot be animated (SPEC §6). — anima validate; spec/SPEC.md:239
- Each `packages/web/dist/anima-*.js` in Anima is a standalone bundle that includes core. Measure a module's cost against anima-icon.js (21.1 KB gz), not its standalone size. — gzip sizes
- The machine is shared (load average 50–70 from other agents): use Playwright with 2 workers, a 180 s webServer timeout and 45 s waits for the runtime. — e2e timeouts, `uptime`
- Since Anima c2b870ae `<anima-icon>` scales both axes by the viewBox's long axis over `grid`; Golem's parts must fill their box exactly, so `styles.css` sets `.golem-anima > anima-icon::part(svg)` to fill (!important: Anima places the SVG inline). Without it the switch draws 0.5 px short and Progress/Meter 21.7 px tall in a 6 px bar. — .cache/f1.ts measured all 81 playground drawings
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
- Parallel agents need distinct Playwright ports: GOLEM_E2E_PORT (default 4621); and a pinned Anima checkout outside ../anima, which moves: ~/.cache/golem/anima-<pin8> (clean clone + `npm ci --ignore-scripts`), now anima-c2b870ae. — this session
- Bun's CSS bundler hoists @import-ed layer blocks above the file's own `@layer a, b;` statement; pack.ts restates the order at the top of dist/styles.css. — bun build of styles.css

- Playwright element screenshots at half-pixel positions look shifted by up to ~1 CSS px: the switch frames looked offset right, but wrapper, button, overlay and shadow SVG all measured 935.5,343.75,31.5×17.5. Measure before "fixing" alignment. — .cache/measure.ts
- Meter/Progress motion frames are not reproducible run to run (±a few px at 40–160 ms): the fill easing is JS through React, whose scheduler runs on MessageChannel tasks that Playwright's fake clock doesn't control; flushing them after each clock step did not make it stable. Moving the easing into Anima fixes it. — 3 runs of meter-frames at c2b870ae
- `pkill -f <pattern>` kills the shell running it when the pattern is in its own command line (exit 144). Kill by port: `kill $(lsof -t -i:<port> -sTCP:LISTEN)`. — this session, twice
- Bedrock serves static files with `cache-control: max-age=14400`; an unversioned /anima/anima.js stayed cached on the owner's iPhone across the Anima bump, the new page called settle() on the old runtime, and every part failed half-mounted (stale drawings over Onyx's paint). build-site now writes /anima/<commit>/ into the page's meta tags; runtime.ts refuses a runtime without the methods Golem calls; a failed mount removes its drawing (e2e/runtime-fallback.spec.ts). — owner's screenshots, reproduced by serving 8ffd7148's runtime to the live page
- The dev server (`bun demo/server.ts`, NODE_ENV=production) bundles pages once at startup: restart it after editing demo/ or package CSS before screenshotting. — stale play.css in a check
- Playwright WebKit doesn't start on this host (missing system libraries, no sudo); use the official image: `docker run --rm --network host -v $PWD/.cache:/work mcr.microsoft.com/playwright:v1.64.1-noble /work/wk-run.sh <script.ts> …`. — this session
- A Playwright script outside the repo (e.g. in the scratchpad) resolves Bun's global playwright-core 1.65, whose browsers aren't installed; run ad-hoc scripts from the repo (.cache/ is gitignored). — "Executable doesn't exist … chromium_headless_shell-1254"

- Integrating parallel component branches: merge them all into one branch; conflicts are only list files: keep both sides; rewrite demo/sections/index.ts in catalogue order (a single conflict there spans imports and the array); dedupe catalogue rows in docs/components.md by hand; renumber clashing anima-findings IDs. — integrate/components
- Agents' frames specs tend to screenshot the whole row, so motion is invisible on the sheet: ask for crops around the moving part at ≥6× (slider fix). — PR #9 review

- `bun run typecheck` does not emit declarations; only `bun run pack` does. Exported forwardRef wrappers of Radix-based Onyx parts need an explicit `React.ForwardRefExoticComponent<…>` annotation or pack fails with TS2742 (CI on PR #14). Agents now run pack + smoke (docs/components.md). — CI run 42514904665

- Polled drawing reads must not throw: inside `expect.poll` a throw fails at once, a wrong value retries. Mid-transition an indicator can have no visible shape (e2e/indicators.ts returns NaN then). Retarget checks on eased values need ≥ half the duration, not one or two frames. — CI runs 42515781193 (Meter, Firefox), 42516569229 (ToggleGroup, Chromium)

- Radix roving focus (ToggleGroup, Tabs) moves focus on arrow/Home/End in a setTimeout. A test that presses Space/Enter right after acts on the old item (toggled Day off; 3 of 12 local runs). Always `await expect(target).toBeFocused()` before activating. — CI run 42517383217, local repeat-each 12

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
- 2026-11-08 21:40 [claude]: PR #9 merged. #13 (actions) reviewed and integrated into PR #14; findings F9/F10/F11 reconciled; CI on #14 failed at pack (TS2742 on Accordion/CollapsibleTrigger) → annotated; pack 73.4 KB from pin, smoke ok; full e2e 600 passed / 0 failed / 66 skipped (Chromium + Firefox); sizes: JS 9.58 KB, CSS 1.71 KB, runtime+bind 22.60 KB, app-UI 48.72 KB gz
- 2026-11-08 22:10 [claude]: PR #14 CI flakes fixed at the root, all in tests: Meter/Progress retarget timing, drawingBox throw inside poll, Radix roving-focus race (ToggleGroup vertical; also Tabs, SectionSelect). Indicator specs 294/294 over 3 repeats
- 2026-11-08 22:25 [claude]: PR #14 merged (844f6dc), closing #10–#13; CI: 600 passed / 0 failed / 66 skipped, pack 73.4 KB from pin, smoke ok. Proof page published and updated with CI numbers
- 2026-11-09 [claude]: playground PR #16 merged; live at golem.mc2.onl
- 2026-11-09 [claude]: Anima pin → c2b870ae. With the old workarounds: e2e 616 passed / 0 failed. Then F1/F5 → ::part(svg), F3 → settle(), F6 → anima bundle (runtime 24.69 KB gz, was 22.60): e2e 616 / 0, all 81 playground drawings fill their box exactly, gallery + frames regenerated (Switch/Checkbox/Radio/Toggle pixel-identical; the rest run noise), pack 75.0 KB + smoke ok. F9, F10 re-measured with anima render: unchanged. F11: convert/interpolate would need data+convert (36.0 KB gz runtime, over budget)
- 2026-11-09 [claude]: v0.1.0 tagged and released (owner yes); anima#39 (F9) and anima#40 (F10) opened. Owner's iPhone: playground drew doubled, stale parts → cached old runtime + no cleanup on failed mount; fixed (versioned runtime URL, API check, cleanup) with e2e proving both paths fail without the fix. Button labels clipped while loading is Onyx's width lock (button.tsx:86–136), shown side by side in the playground now
- 2026-11-09 [claude]: v0.1.1 released. bedrock#10: @bedrock/ui exports Golem's controls, pebbles serve /_bedrock/anima/<version>/. Typewriter unchanged under bedrock dev: 21 buttons + tabs drawn, editor pixel-identical; chrono/cloudly/discord-reader/netflix-code typecheck unchanged. Bedrock suite 851/3 (known failures)
