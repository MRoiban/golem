// Loading the Anima runtime and compiled scenes. Golem never imports Anima statically: the
// runtime is loaded by URL when motion is wanted, and its absence is a normal state (plain Onyx).
import type { AnimaIconClass, AnimaIconElement, AnimaModel } from "./types";

export type AnimaConfig = {
  /** URL of the Anima runtime module (registers <anima-icon>). null: Anima is off. */
  runtime: string | null;
  /** Base URL of compiled scenes: `${scenes}${name}.ani`. */
  scenes: string;
};
export type RuntimeState = "idle" | "loading" | "ready" | "absent";

let config: AnimaConfig = { runtime: null, scenes: "/anima/scenes/" };
let configured = false;

/**
 * Zero-configuration default: the page (or the server that serves it, e.g. Bedrock) can declare
 * where Anima lives, so components get motion without any app code:
 *   <meta name="golem-anima-runtime" content="/anima/anima.js">
 *   <meta name="golem-anima-scenes" content="/anima/scenes/">
 * An explicit configureAnima() (or GolemProvider's `anima` prop) always wins.
 */
function fromDocument() {
  if (configured || typeof document === "undefined") return;
  configured = true;
  const meta = (n: string) => document.querySelector<HTMLMetaElement>(`meta[name="${n}"]`)?.content || null;
  const runtime = meta("golem-anima-runtime");
  const scenes = meta("golem-anima-scenes");
  if (runtime) config = { ...config, runtime };
  if (scenes) config = { ...config, scenes };
}
let state: RuntimeState = "idle";
let loading: Promise<boolean> | null = null;
const listeners = new Set<() => void>();
const setState = (s: RuntimeState) => { state = s; for (const l of listeners) l(); };

export function configureAnima(next: Partial<AnimaConfig>) {
  configured = true;
  config = { ...config, ...next };
  if (state === "absent") { state = "idle"; loading = null; }
}
export const animaConfig = () => { fromDocument(); return config; };
export const runtimeState = () => state;
export function onRuntimeState(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }

/** The <anima-icon> methods Golem calls. settle() arrived in Anima c2b870ae (golem findings F3). */
const REQUIRED = ["loadModel", "set", "settle", "invalidate", "destroy"] as const;
/** Names of required methods the registered runtime lacks: an older runtime, e.g. a stale cached copy. */
function missingApi(): string[] {
  const proto = (customElements.get("anima-icon") as CustomElementConstructor | undefined)?.prototype as Record<string, unknown> | undefined;
  return REQUIRED.filter((m) => typeof proto?.[m] !== "function");
}
function accept(url: string): boolean {
  const missing = missingApi();
  if (!missing.length) { if (state !== "ready") setState("ready"); return true; }
  console.warn(`[golem] The Anima runtime at ${url} lacks ${missing.join(", ")}: it is older than this Golem `
    + "(a cached copy from before an update?). Using plain Onyx. Serve the runtime under a versioned URL.");
  setState("absent");
  return false;
}

/** Resolves true once a compatible <anima-icon> is defined; false when Anima is unavailable or too old (never throws). */
export function loadAnima(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (customElements.get("anima-icon")) return loading ??= Promise.resolve(accept("(already registered)"));
  if (loading) return loading;
  fromDocument();
  if (!config.runtime) { setState("absent"); return (loading = Promise.resolve(false)); }
  setState("loading");
  const url = config.runtime;
  loading = import(/* @vite-ignore */ url)
    .then(() => customElements.whenDefined("anima-icon"))
    .then(() => accept(url))
    .catch((e: unknown) => {
      console.info(`[golem] Anima runtime unavailable (${url}); using plain Onyx.`, e);
      setState("absent");
      return false;
    });
  return loading;
}

// ---- compiled models, shared per (file, component) ----
// A compiled model is specific to its root component, so the key is (scene URL, component).
// Compiling costs tens of ms per document (anima-kit: ~55 ms for a group file); instantiating a
// cached model with loadModel is cheap.
const models = new Map<string, Promise<AnimaModel>>();
const docs = new Map<string, Promise<object>>();
export const modelKey = (src: string, component?: string) => `${src}#${component ?? ""}`;
export const sceneUrl = (name: string) => (/[/.]/.test(name) ? name : `${animaConfig().scenes}${name}.ani`);

function fetchDoc(src: string): Promise<object> {
  let p = docs.get(src);
  if (!p) {
    p = fetch(src).then((r) => { if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`); return r.json() as Promise<object>; });
    docs.set(src, p);
    p.catch(() => docs.delete(src));
  }
  return p;
}

/** The compiled model for (src, component), compiled once per page. */
export function getModel(src: string, component?: string): Promise<AnimaModel> {
  const key = modelKey(src, component);
  let p = models.get(key);
  if (!p) {
    p = fetchDoc(src).then((doc) => {
      const Icon = customElements.get("anima-icon") as AnimaIconClass | undefined;
      if (!Icon) throw new Error("anima-icon is not defined");
      const compiled = Icon.compile?.(doc);
      if (compiled?.model) return compiled.model;
      if (compiled && compiled.diagnostics.length) throw new Error(`${src}: ${compiled.diagnostics.map((d) => d.message ?? d.code).join("; ")}`);
      // Older runtimes without compile(): load once into a detached host and keep its model.
      const probe = document.createElement("anima-icon") as AnimaIconElement;
      if (component) probe.setAttribute("component", component);
      probe.load(doc);
      const model = probe.player?.model;
      probe.destroy();
      if (!model) throw new Error(`${src}: no model`);
      return model;
    });
    models.set(key, p);
    p.catch(() => models.delete(key));
  }
  return p;
}

/** Whether (src, component) was already requested (its compile is shared). */
export const hasModel = (src: string, component?: string) => models.has(modelKey(src, component));

/** Test hook: how many distinct models were compiled. */
export const modelCacheSize = () => models.size;
