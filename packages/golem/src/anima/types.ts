// The parts of <anima-icon> Golem uses, from Anima's public web host API (docs/WEB.md).
// Declared here so Golem compiles without Anima installed.
export type AnimaModel = object;
export type AnimaDiagnostic = { code?: string; message?: string };
export type AnimaColorHandle = { set(rgba: number[]): void };
export type AnimaData = {
  batch(f: () => void): void;
  color(path: string): AnimaColorHandle;
  number(path: string): { set(v: number): void };
};
export interface AnimaIconElement extends HTMLElement {
  ready: Promise<void>;
  /** Exists once a model has loaded. step(0) + invalidate() applies pending changes at once (docs/WEB.md). */
  player?: { model: AnimaModel; step(dt: number): unknown };
  load(doc: object | string, markup?: boolean): AnimaDiagnostic[] | undefined;
  loadModel(model: AnimaModel): void;
  set(name: string, value: boolean | number): void;
  fire(name: string): void;
  invalidate(): void;
  /** Resolve the current inputs, blends and once-timelines silently, then draw (true if at rest). */
  settle(): boolean;
  destroy(): void;
  /** Present when the data-host module is loaded. */
  data?: AnimaData;
}
export type AnimaIconClass = CustomElementConstructor & {
  compile?(source: object | string, markup?: boolean): { model?: AnimaModel; diagnostics: AnimaDiagnostic[] };
};
