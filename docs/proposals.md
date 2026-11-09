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

Done in [bedrock#10](https://github.com/MRoiban/bedrock/pull/10) (owner go-ahead 2026-11-09);
design.md §7 has the table. It differs from the first proposal in one way: no meta-tag injection.
`@bedrock/ui` calls `configureAnima` with `/_bedrock/anima/<golem version>/`, and each pebble serves
that path from its installed Golem's `runtime/`. A fixed path let a cached runtime meet a newer page
(the playground broke that way on an iPhone, 2026-11-09).

## Anima

See [anima-findings.md](anima-findings.md): F1 (non-square viewBox sizing), F2 (writes before the
player exists), F3 (settle API), F4 (animatable slot colours), F5 (`part="svg"`), F6 (a
supported module bundler), F7, F8.
