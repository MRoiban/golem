import * as React from "react";

/** Geometry only: Onyx has already resolved/clamped the value and inferred the tone in the DOM. */
export function readFill(root: HTMLElement, meter = false) {
  const track = meter ? root.querySelector<HTMLElement>("[data-slot='meter-track']") ?? root : root;
  const min = Number(track.getAttribute("aria-valuemin"));
  const max = Number(track.getAttribute("aria-valuemax"));
  const now = Number(track.getAttribute("aria-valuenow"));
  return {
    level: max > min ? (now - min) / (max - min) : 0,
    indeterminate: !track.hasAttribute("aria-valuenow"),
    tone: root.getAttribute("data-tone") ?? "neutral",
  };
}

// Anima bind reads inputs, not animated properties, and has no smoothing operator (F9).
// Interpolate only the DOM-derived drawing input here; Anima still owns geometry and tone fades.
// Solve Onyx's emphasis cubic (.2, 0, .16, 1) with a bounded binary search.
function emphasis(x: number) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 16; i++) {
    const t = (lo + hi) / 2, s = 1 - t;
    if (3 * s * s * t * .2 + 3 * s * t * t * .16 + t * t * t < x) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return 3 * (1 - t) * t * t + t * t * t;
}
export function useFillLevel(target: number, ready: boolean) {
  const [level, setLevel] = React.useState(target);
  const current = React.useRef(target);
  const wasReady = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!ready || !wasReady.current) {
      current.current = target; setLevel(target); wasReady.current = ready; return;
    }
    const from = current.current, start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 240);
      current.current = from + (target - from) * emphasis(t);
      if (t === 1) current.current = target;
      setLevel(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ready]);
  return level;
}
