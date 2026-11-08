// Anima token names, kept free of the token values so runtime code can import them cheaply.

/**
 * Anima theme tokens: the names Anima scenes use for colour slots (`<color name="buttonBg" …/>`,
 * rendered as var(--anima-buttonBg)) and for the Theme model ($theme:buttonBg). Each maps to an
 * Onyx token, so Anima drawings follow the page theme. Names follow anima-kit's Theme model.
 */
export const animaColors = {
  inputBorder: "control-input-border", inputBg: "control-input-bg",
  buttonBg: "control-button-bg", buttonHover: "control-button-hover-bg", buttonFg: "control-button-fg",
  track: "control-track", focusRing: "control-focus-ring", secondaryBg: "control-secondary-bg",
  selected: "state-selected", selectedFg: "state-selected-fg", hover: "state-hover",
  muted: "text-muted", desc: "text-description", inverse: "text-inverse", fg: "text-foreground",
  border: "border-default", subtle: "border-subtle", panel: "surface-panel", raised: "surface-raised",
  infoFg: "tone-info-fg", infoBg: "tone-info-bg", infoBorder: "tone-info-border", infoSolid: "tone-info-solid",
  successFg: "tone-success-fg", successBg: "tone-success-bg", successBorder: "tone-success-border", successSolid: "tone-success-solid",
  warningFg: "tone-warning-fg", warningBg: "tone-warning-bg", warningBorder: "tone-warning-border", warningSolid: "tone-warning-solid",
  dangerFg: "tone-danger-fg", dangerBg: "tone-danger-bg", dangerBorder: "tone-danger-border", dangerSolid: "tone-danger-solid",
  shadowInk: "palette.black",
} as const;
export type AnimaColor = keyof typeof animaColors;

/** Anima numeric theme values (Theme model numbers), per theme. `motion` is written at runtime. */
export const animaNumbers = {
  shadow: { dark: 0.24, light: 0.08, rose: 0.08, "rose-dark": 0.24 },
  buttonRadius: { dark: 6, light: 6, rose: 14, "rose-dark": 14 },
} as const satisfies Record<string, Record<"dark" | "light" | "rose" | "rose-dark", number>>;

export const ANIMA_COLORS = Object.keys(animaColors) as AnimaColor[];
export const ANIMA_NUMBERS = Object.keys(animaNumbers) as (keyof typeof animaNumbers)[];
/** CSS variable carrying an Anima number per theme (see animaSlotsCss). */
export const animaNumberVar = (k: string) => `--golem-anima-${k}`;
