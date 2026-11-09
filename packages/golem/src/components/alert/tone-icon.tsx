import * as React from "react";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../../anima";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";
/** A mount-only flourish. Theme changes, parent renders and motion toggles never replay it. */
export function ToneIcon({ tone, scene, fallback }: { tone: Tone; scene: "alert" | "toast"; fallback?: React.ReactNode }) {
  const anima = React.useRef<AnimaHandle>(null);
  const played = React.useRef(false);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const onStatus = React.useCallback((next: AnimaStatus) => {
    if (next === "ready" && !played.current) {
      played.current = true;
      anima.current?.fire("draw");
      // Begin the entrance before revealing the drawing: no full-icon flash before trim=0.
      // settle() would finish the draw-in; step(0) + invalidate() applies only its first frame
      // (Anima's documented way to resolve pending changes synchronously, docs/WEB.md).
      const icon = anima.current?.icon();
      icon?.player?.step(0);
      icon?.invalidate();
    }
    setStatus(next);
  }, []);
  return <span className="golem-tone-icon" data-golem-part={scene} data-anima={status} data-icon-tone={tone} aria-hidden="true">
    {fallback}
    <AnimaControl ref={anima} scene={scene} inputs={{ success: tone === "success", danger: tone === "danger", warning: tone === "warning" }}
      className="golem-part__motion golem-tone-icon__motion" onStatus={onStatus} />
  </span>;
}
