import * as React from "react";
import { useGolem } from "./provider";
import { animaConfig, getModel, hasModel, loadAnima, sceneUrl } from "./runtime";
import { enqueueMount } from "./scheduler";
import { writeThemeData } from "./theme";
import type { AnimaIconElement } from "./types";

/** off: not mounted (motion off, Anima absent or failed); pending: queued/loading; ready: drawn. */
export type AnimaStatus = "off" | "pending" | "ready";
export type AnimaHandle = { fire(trigger: string): void; icon(): AnimaIconElement | null };
export type AnimaInputs = Record<string, boolean | number>;

export type AnimaControlProps = {
  /** Scene name (served from the configured scenes URL) or a URL. */
  scene: string;
  /** Root component, for documents with several exported components. */
  component?: string;
  /** Inputs, written whenever they change. React owns the state; the scene only draws it. */
  inputs?: AnimaInputs;
  onStatus?: (status: AnimaStatus) => void;
  className?: string;
  style?: React.CSSProperties;
};

/** waitMs: fetch + compile (or waiting for a shared compile); ms: instantiating and drawing. */
export type MountMetric = { scene: string; ms: number; waitMs: number; cached: boolean; at: number };
/** Mount timings, for the demo and tests. */
export const mountMetrics: MountMetric[] = [];

/**
 * A decorative Anima drawing. It is always aria-hidden and never takes pointer or keyboard input:
 * the React control underneath owns roles, focus and events. Renders nothing when motion is off or
 * Anima is unavailable, so the caller's plain Onyx rendering is the fallback.
 */
export const AnimaControl = React.forwardRef<AnimaHandle, AnimaControlProps>(function AnimaControl(
  { scene, component, inputs, onStatus, className, style }, ref,
) {
  const { motion, theme, themeVersion } = useGolem(); // theme: re-sync the data model on change
  const box = React.useRef<HTMLSpanElement>(null);
  const icon = React.useRef<AnimaIconElement | null>(null);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const latest = React.useRef(inputs);
  latest.current = inputs;
  const written = React.useRef<AnimaInputs>({});
  const enabled = motion === "anima";

  React.useImperativeHandle(ref, () => ({
    fire: (t) => icon.current?.fire(t),
    icon: () => icon.current,
  }), []);
  React.useEffect(() => { onStatus?.(status); }, [status]);

  React.useEffect(() => {
    if (!enabled) return;
    const el = box.current;
    if (!el) return;
    let alive = true;
    let cancel = () => {};
    setStatus("pending");
    void loadAnima().then((ok) => {
      if (!alive) return;
      if (!ok) { setStatus("off"); return; }
      const src = sceneUrl(scene);
      cancel = enqueueMount(el, async () => {
        const t0 = performance.now();
        const cached = hasModel(src, component);
        try {
          const model = await getModel(src, component);
          const t1 = performance.now();
          if (!alive) return;
          const node = document.createElement("anima-icon") as AnimaIconElement;
          if (component) node.setAttribute("component", component);
          node.setAttribute("fit", "fill");
          node.setAttribute("aria-hidden", "true");
          el.append(node);
          node.loadModel(model);
          // Inputs written before the player exists are queued by Anima; Golem still waits for the
          // load, because it reports "ready" (and hides Onyx's paint) only once the drawing exists.
          if (!node.player) await new Promise((r) => node.addEventListener("anima:load", r, { once: true }));
          if (!alive) { node.destroy(); node.remove(); return; }
          icon.current = node;
          // Start at rest in the current state: write inputs and theme data, then settle every blend
          // silently before the first paint (a checked switch must not animate from off on mount).
          written.current = { ...latest.current };
          for (const [k, v] of Object.entries(written.current)) node.set(k, v);
          writeThemeData(node, true);
          node.settle();
          mountMetrics.push({ scene, cached, waitMs: t1 - t0, ms: performance.now() - t1, at: performance.now() });
          setStatus("ready");
        } catch (e) {
          console.warn(`[golem] ${scene}: Anima mount failed; using plain Onyx.`, e);
          if (alive) setStatus("off");
        }
      });
    });
    return () => {
      alive = false;
      cancel();
      const node = icon.current;
      icon.current = null;
      if (node) { node.destroy(); node.remove(); }
      setStatus("off");
    };
  }, [enabled, scene, component]);

  // Input changes after mount.
  React.useEffect(() => {
    const node = icon.current;
    if (!node || status !== "ready" || !inputs) return;
    for (const [k, v] of Object.entries(inputs)) {
      if (written.current[k] !== v) { node.set(k, v); written.current[k] = v; }
    }
  });

  // Theme data model (scenes using colour slots need nothing here).
  React.useEffect(() => {
    if (icon.current && status === "ready") writeThemeData(icon.current, true);
  }, [theme, themeVersion, status]);

  if (!enabled) return null;
  return <span ref={box} className={["golem-anima", className].filter(Boolean).join(" ")} data-status={status} aria-hidden="true" style={style} />;
});

/** Whether Anima is configured at all (for callers that want to skip work). */
export const animaConfigured = () => animaConfig().runtime !== null;
