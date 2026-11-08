# Disclosure implementation

Branch `comp/disclosure`; scope Collapsible, Accordion, Alert, Toast. Binding brief:
`/tmp/claude-1000/-data-t3-projects-golem/0eadb16b-73bb-4b0d-ad78-4f7ff1bda9a1/scratchpad/briefs/disclosure.md`.
Playwright port 4645; pinned Anima `~/.cache/golem/anima-8ffd7148`.

## Design decisions
- Both Onyx triggers already render chevrons. Portals paint inside those exact icon boxes (no
  new flex children), inherit their dimensions (compact 12 px Collapsible, 14 px Accordion),
  and read `aria-expanded` via `useDomState`. Closed is -90 degrees, open zero; 200 ms with
  cubic(0.2,0,0.16,1.16), a restrained overshoot. Original pseudo-glyph only hidden at ready;
  its CSS transform/transition is disabled then, preventing a double rotation.
- asChild triggers keep caller-owned markup and rendering unchanged. No Onyx icon slot means
  no Golem drawing. All roots/content/header/item exports are unchanged Onyx primitives.
- Alert's `icon` hook accepts a mount-only ToneIcon, with Onyx Icon retained as fallback.
  Custom icon, null and asChild remain caller-owned. Tone follows the root `data-tone` DOM.
- Toast has no queue icon renderer hook. Wrap its provider with viewport=false, preserve Onyx's
  provider/announcer/queue, and render decorated Onyx ToastQueueViewport. A MutationObserver
  discovers existing icon slots; React portals append decorative ToneIcons with stable toast IDs.
  Original icon remains in place and only its visibility changes at ready. All timers, gestures,
  progress, focus restoration, live regions, keyboard and action rendering are Onyx's.
- Four 16-unit stroked tone glyphs (1.25 stroke), 200 ms trim draw once after ready. Neutral uses
  info geometry with Onyx's neutral display foreground. Theme changes/rerenders/motion toggles
  do not replay entrance. Reduced or missing runtime shows original Onyx icons.

## Evidence in progress
- `bun install`, build:tokens and build:anima from the pin passed; all scenes core-only.
- typecheck passed; unit tests 36/36; initial size report passes all budgets.
- Browser suites and screenshot review in progress. No new Anima gap found so far.
