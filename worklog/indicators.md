# Indicators

Branch `comp/indicators`. Implementation group: Tabs (motion on TabsList), single ToggleGroup,
SectionSelect popup highlight. See binding brief in the session's scratchpad.

Decisions from Onyx v0.2.2 source:
- Tabs editor variant paints a panel with border; line variant paints a focusRing underline.
  Tabs has no vertical API; preserve its horizontal manual activation (arrows focus; Enter/Space selects).
- ToggleGroup single is a Radix radiogroup; multiple is a toolbar of pressed buttons. Multiple
  deliberately retains plain Onyx's independent backgrounds, as there is no unique pill to move.
- SectionSelect is a portalled combobox/listbox. Its background follows data-active (focus),
  while aria-selected marks the committed value/check. Animate the former, preserve the latter.
  It has neither disabled items nor a forwarded ref. Popup is discovered through aria-controls.
- Theme/motion pickers remain direct Onyx (demo/ui.tsx untouched).

Scenes require only bind. Positions and target sizes/radii come from rendered Onyx DOM;
Anima core timelines supply 200 ms travel and leading-edge stretch. Reciprocal transforms carry
numeric distances into timeline translations. Zero-distance axes need 0.001, since 0.000001
rounds to zero in SVG matrices (F10). Onyx renders until each scene is ready.

Evidence:
- Pinned build validates all scenes. Only bind is required; runtime 23,139 B gz (22.60 KB),
  scenes tabs 1,340 B, toggle-group/section-select 1,346 B each, comfortably within budgets.
- Typecheck passes; 36 unit tests pass. Full e2e: 144 pass (72 Chromium + 72 Firefox),
  comprising 49 indicators + 23 unchanged Switch tests per browser.
- Screenshot run: 19 Chromium tests pass, producing 48 PNGs. Opened and inspected every PNG:
  each component's six themes + fallback + phone; SectionSelect's six popup themes + fallback
  + phone; 0/40/80/200 ms frames for all three, plus reverse Tabs frames.
- Screenshot-driven fixes: tiny initial transforms collapsed the drawing (F10); quantized measured
  distances also eliminate width drift after resize. Editor tabs now have only top corners rounded
  and an open bottom, matching Onyx. Added space between demo examples. No double painting,
  clipping or horizontal overflow; popup fallback and animated selected boxes coincide.
- Final targeted recheck: 44 pass (22 per browser). Final SectionSelect rerun after demo
  test-ID and reference-layout cleanup: 32 pass (16 per browser). Screenshot rerun: 19 pass;
  reviewed the eight changed gallery PNGs; the other 40 match the previously reviewed hashes.
- Gallery gotcha: reserve `data-testid="section-*"` for the Section card. Its generic screenshot
  selector otherwise treats nested demo test IDs as section cards. Demo uses `select-*` for controls.

Limitations/intentional scope: Onyx Tabs has no vertical orientation API, and SectionSelect has
no disabled-item API. Multiple ToggleGroup uses Onyx's existing per-item painting. The scene adopts
the target item's measured width on retarget and applies its directional stretch in Anima.
No shared bridge/helpers/scripts were changed. Shared edits are only exports, stylesheet imports,
demo registration, catalogue rows, and the requested Anima finding.
Use GOLEM_E2E_PORT=4643, GOLEM_E2E_WORKERS=2 and ANIMA_DIR=~/.cache/golem/anima-8ffd7148.
