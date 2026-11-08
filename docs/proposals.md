# Proposed changes to other repos

Golem does not edit Onyx, `@bedrock/ui` or Anima. These are proposals for their owners. Anima's
bugs and missing APIs are in [anima-findings.md](anima-findings.md).

## Onyx

1. **Let `Switch` accept a decoration slot.** Golem lays its Anima drawing over the Switch as a
   sibling, because Onyx's `Switch` renders its own thumb and `{...props}` would override children.
   An optional `thumb` (or `children`) slot rendered inside the button would let motion parts live
   inside the control's box and inherit its `disabled` opacity.
2. **Export token tables as data, not only CSS.** Onyx already exports `ONYX_SEMANTIC_DARK/LIGHT`,
   and Golem uses them as its parity oracle. If Golem becomes the token source, Onyx could import the
   generated tables instead, so the values live in one place. This needs an owner decision (§7 of
   design.md).
3. **Reduced-motion rule.** `[data-slot] { transition-duration: 1ms !important }` sits in
   `@layer onyx.base`, so no later layer or unlayered rule can lengthen a transition under
   prefers-reduced-motion. That is intentional, but worth documenting next to the theme docs:
   consumers who need an exception (a progress bar) cannot override it.

## `@bedrock/ui` and Bedrock

The owner decided that pebbles get Anima motion without any code changes (design.md §7). Golem's
side is done (no provider needed; the runtime is found through meta tags). These changes are needed
in `@bedrock/ui` and Bedrock:

1. **Re-export Golem components in place of Onyx's**, with identical props. Today:
   `export * from "@mroiban/onyx"`, then `export { Switch } from "@golem/components"` (an explicit
   export takes precedence over the star export).
2. **Append Golem's CSS to the prebuilt stylesheet** in `scripts/build-css.ts`, after Onyx's:
   `@golem/tokens/golem.css`, `@golem/tokens/anima-slots.css`, `@golem/components/styles.css`
   (about 3.9 KB gz together).
3. **Serve Anima and inject the meta tags.** Bedrock's dev server and deployed pebbles serve the
   Anima runtime and Golem's compiled scenes at a fixed path (e.g. `/_bedrock/anima/`) and add
   `<meta name="golem-anima-runtime" content="/_bedrock/anima/anima.js">` and
   `<meta name="golem-anima-scenes" content="/_bedrock/anima/scenes/">` to every pebble page.
   Where the files come from depends on the open question of how private Anima is consumed
   (design.md §11).

Without item 3, pebbles still work and show plain Onyx.

## Anima

See [anima-findings.md](anima-findings.md): F1 (non-square viewBox sizing), F2 (writes before the
player exists), F3 (settle API), F4 (animatable slot colours), F5 (`part="svg"`), F6 (a
supported module bundler), F7, F8.
