import * as React from "react";
import { createPortal } from "react-dom";
import { Progress as OnyxProgress, type ProgressProps as OnyxProgressProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState, useMergedRef } from "../shared";
import { readFill, useFillLevel } from "./use-fill";
export type ProgressProps = OnyxProgressProps;
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(props, ref) {
  const root = React.useRef<HTMLDivElement | null>(null);
  const merged = useMergedRef(root, ref);
  const [target, setTarget] = React.useState<HTMLElement | null>(null);
  const setRef = React.useCallback((node: HTMLDivElement | null) => {
    merged(node); setTarget(node);
  }, [merged]);
  const state = useDomState(root, ["aria-valuenow", "aria-valuemin", "aria-valuemax", "data-tone", "data-state"],
    node => readFill(node, false), { level: 0, indeterminate: false, tone: "neutral" }, true);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const level = useFillLevel(state.level, status === "ready");
  return <div className="golem-progress golem-part" data-golem-part="progress" data-anima={status}>
    <OnyxProgress {...props} ref={setRef} />
    {target && createPortal(<AnimaControl scene="progress" className="golem-part__motion golem-progress__motion"
      inputs={{ level, indeterminate: state.indeterminate, info: state.tone === "info", success: state.tone === "success", warning: state.tone === "warning", danger: state.tone === "danger" }} style={{ clipPath: state.indeterminate ? undefined : `inset(0 ${100 * (1 - level)}% 0 0 round var(--onyx-radius-full))` }} onStatus={setStatus} />, target)}
  </div>;
});
