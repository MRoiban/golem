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

## `@bedrock/ui`

1. **Re-export Golem components** in place of the matching Onyx ones once a few are proven (Switch
   now), and append `@golem/tokens/golem.css` and `anima-slots.css` to the prebuilt `styles.css`.
   Pebbles then get Anima motion parts when the runtime is present, and plain Onyx when it is not,
   with no code change.
2. **Serve the Anima runtime and scenes** from a Bedrock-known path (e.g. `/_bedrock/anima/`) so
   `GolemProvider` needs no per-pebble configuration.

## Anima

See [anima-findings.md](anima-findings.md): F1 (non-square viewBox sizing), F2 (writes before the
player exists), F3 (settle API), F4 (animatable slot colours), F5 (`part="svg"`), F6 (a
supported module bundler), F7, F8.
