// Motion preference. "anima": Anima motion parts on. "css": plain Onyx (its CSS transitions).
// "reduced": plain Onyx with transitions cut to 1 ms. "system" follows prefers-reduced-motion live.
export type MotionSetting = "system" | "anima" | "css" | "reduced";
export type Motion = Exclude<MotionSetting, "system">;

const query = () => (typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null);
export const systemPrefersReduced = () => query()?.matches ?? false;
export function resolveMotion(setting: MotionSetting, prefersReduced = systemPrefersReduced()): Motion {
  return setting === "system" ? (prefersReduced ? "reduced" : "anima") : setting;
}
export function onSystemMotionChange(f: () => void): () => void {
  const q = query();
  q?.addEventListener("change", f);
  return () => q?.removeEventListener("change", f);
}
