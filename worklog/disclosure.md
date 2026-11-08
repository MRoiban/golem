# Disclosure implementation

Branch `comp/disclosure`; scope Collapsible, Accordion, Alert, Toast. Binding brief:
`/tmp/claude-1000/-data-t3-projects-golem/0eadb16b-73bb-4b0d-ad78-4f7ff1bda9a1/scratchpad/briefs/disclosure.md`.
Playwright port 4645; pinned Anima `~/.cache/golem/anima-8ffd7148`.

## Design decisions
- Both Onyx triggers already render chevrons. Portals paint inside those exact icon boxes (no
  new flex children), inherit their dimensions (Onyx text-xs Collapsible, fixed 16 px Accordion),
  and read `aria-expanded` via `useDomState`. Closed is -90 degrees, open zero; 200 ms with
  cubic(0.2,0,0.16,1.16), a restrained overshoot. Original pseudo-glyph only hidden at ready;
  its CSS transform/transition is disabled then, preventing a double rotation.
- asChild triggers keep caller-owned markup and rendering unchanged. No Onyx icon slot means
  no Golem drawing. All roots/content/header/item exports are unchanged Onyx primitives.
- Alert's `icon` hook accepts a mount-only ToneIcon, with Onyx Icon retained as fallback.
  Custom icon, null and asChild remain caller-owned. Tone follows the root `data-tone` DOM.
- Toast has no queue icon renderer hook. Wrap its provider with viewport=false, preserve Onyx's
  provider/announcer/queue, and render decorated Onyx ToastQueueViewport. A MutationObserver
  discovers native Codicon elements in the icon slots; React portals append decorative ToneIcons
  with stable toast IDs.
  Original icon remains in place and only its visibility changes at ready. All timers, gestures,
  progress, focus restoration, live regions, keyboard and action rendering are Onyx's.
- Four 16-unit stroked tone glyphs (1.25 stroke), 200 ms trim draw once after ready. Neutral uses
  info geometry with Onyx's neutral display foreground. The entrance is stepped to trim=0 before
  showing the drawing, avoiding a full-icon flash. Theme changes/rerenders/motion toggles
  do not replay entrance. Reduced or missing runtime shows original Onyx icons.

## Verification
- `bun install`, build:tokens and build:anima from the pin passed; all scenes core-only.
- Final typecheck passed; unit tests 36/36; all size budgets pass. Scenes: Collapsible 427 B gz,
  Accordion 425 B gz, Alert 915 B gz, Toast 917 B gz. JS 5.41 KB, CSS 0.66 KB, runtime 20.70 KB,
  app UI total including Switch 30.75 KB gz.
- Final browser run: 168/168 passed (9.0 min): Chromium 84/84, Firefox 84/84. Per browser:
  Collapsible 15, Accordion 15, Alert 15, Toast 16, Switch regression 23. Full command:
  `GOLEM_E2E_PORT=4645 GOLEM_E2E_WORKERS=2 bunx playwright test e2e/collapsible.spec.ts
  e2e/accordion.spec.ts e2e/toast.spec.ts e2e/alert.spec.ts e2e/switch.spec.ts`.
- Rebased onto main fbdb636 before the final browser run. Catalogue rows marked done.
- Chromium gallery + frames 12/12, focused draw/geometry/stacked visibility 3/3. Reviewed all
  70 PNGs via the four contact sheets and original phone, glyph and mid-motion detail captures.
- No new Anima gap. Existing F3 direct-player-step workaround starts the entrance before reveal.

## Findings and review changes
- Onyx Codicon has a fixed 16 px box for Alert/Toast, even when the body font is 12 px. The first
  gallery showed undersized drawings. ToneIcon now uses that native box; Toast portals sit inside
  the original Codicon. Browser geometry checks compare native and drawing boxes.
- Neutral colour override must be on anima-icon, because slot CSS redeclares values on that host.
- Onyx ToastAnnouncer is always one polite live region, including danger. Kept unchanged.
- Onyx's background-toast content visibility must beat the ready drawing's visibility rule.
- Anima pauses offscreen drawings. A gallery screenshot can scroll a part into view during its
  first entrance; tall phone cards can keep some parts offscreen. Minimal additive preparation in
  e2e/gallery.spec.ts scrolls and finishes one-shot work before the at-rest capture. Frames still
  pause and step explicitly. This is the only shared change beyond registration/catalogue lines.
- The frames harness first settles an existing entrance before requesting another draw. A draw
  trigger during the one-shot drawing state intentionally does not restart the component scene.
