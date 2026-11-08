# Choice implementation

Branch `comp/choice`. Scope: Checkbox, RadioGroup/RadioGroupItem, Toggle; brief `/tmp/claude-1000/-data-t3-projects-golem/0eadb16b-73bb-4b0d-ad78-4f7ff1bda9a1/scratchpad/briefs/choice.md`.

Design refinements after reading Onyx v0.2.2:
- Checkbox is a native input (not Radix), so its ref is HTMLInputElement and its existing data-state drives checked/mixed. Box is 1rem = 16px (measured against Onyx during screenshot review), radius 4px. Articulated two-segment stroke gives check/dash morph with core transforms; trimEnd draws it. Active fill pops 1.08; press squashes.
- RadioGroup is directly Onyx; per-item decorative dot portals into Onyx's control slot. Contents wrapper leaves card grids and labels intact. Onyx retains input background/border and keyboard. The scene fades the selected inner fill with the dot, preserving a visible shrinking exit in light themes. Default asChild without a control slot falls back to plain Onyx.
- Toggle background alone is under the unchanged Onyx button (z-index 0 vs 1, isolated wrapper); direct text nodes and SVG remain untouched. Square scene is clipped using live CSS radius. Supports arbitrary width and sm/md sizes without scaling children.

Validation/evidence:
- Full choice + Switch suite: 142/142 (71 Chromium, 71 Firefox), including Switch's 46 regression tests. Checkbox/RadioGroup after visual refinements: 64/64 (32/browser); final drawing checks after seam/miter fixes: 4/4 (2/browser).
- Typecheck clean; 36 unit tests pass. Pinned Anima build validates all scenes, core only. Final gz sizes: Checkbox 1049 B, RadioGroup 553 B, Toggle 515 B; runtime 21196 B, app UI total 29.41 KB; all budgets pass.
- Initial gallery/frame review corrected Checkbox scene from 14 to actual 16px; adjusted dash length/thickness, overlapped its articulated dash segments to avoid a raster seam, and extended the short check leg half a stroke through its joint to match Onyx's miter. Radio's outgoing white dot had disappeared against the light native input fill: scene now fades the selected fill as the dot shrinks. Fill radius 7.5 overlaps Onyx's inner border by 0.5px to remove an antialias seam.
- Toggle stacking correct in all six themes, fallback and phone; direct text/SVG are unchanged above z-index 0 motion. Moved hover paint under the selected background so it cannot hide the shrinking exit.
- Anima findings: none new (fill=none is omitted for stroke-only paths, as required by the schema).
- Radix arrow focus uses a timer; tests hold the key until focus/selection lands rather than allowing immediate keyup to overtake the timer on the shared busy machine.

Screenshots: gallery + all three frame specs passed 11/11 in Chromium, then regenerated Checkbox/RadioGroup independently (9/9 each) after final joint/overlap refinements. Opened every original PNG: 24 gallery images (six themes + fallback + phone per component), 20 checkbox frames, 6 radio frames, 12 toggle frames, including selected press shots for both text/icon. Contact sheets generated with main's scripts/contact-sheet.ts; reviewed all three. Catalogue rows done. No shared bridge, helper or script edits.
