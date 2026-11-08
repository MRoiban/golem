import * as React from "react";
import { createPortal } from "react-dom";
import { Meter as OnyxMeter, type MeterProps as OnyxMeterProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState, useMergedRef } from "../shared";
import { readFill, useFillLevel } from "../progress/use-fill";
export type MeterProps = OnyxMeterProps;
export const Meter = React.forwardRef<HTMLDivElement, MeterProps>(function Meter(props, ref) {
  const root = React.useRef<HTMLDivElement | null>(null);
  const merged = useMergedRef(root, ref);
  const [target, setTarget] = React.useState<HTMLElement | null>(null);
  const setRef = React.useCallback((node: HTMLDivElement | null) => {
    merged(node); setTarget(node?.querySelector<HTMLElement>("[data-slot='meter-track']") ?? node);
  }, [merged]);
  const state = useDomState(root, ["aria-valuenow", "aria-valuemin", "aria-valuemax", "data-tone", "data-state"],
    node => readFill(node, true), { level: 0, indeterminate: false, tone: "neutral" }, true);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const level = useFillLevel(state.level, status === "ready");
  return <div className="golem-meter golem-part" data-golem-part="meter" data-anima={status}>
    <OnyxMeter {...props} ref={setRef} />
    {target && createPortal(<AnimaControl scene="meter" className="golem-part__motion golem-meter__motion"
      inputs={{ level, indeterminate: state.indeterminate, info: state.tone === "info", success: state.tone === "success", warning: state.tone === "warning", danger: state.tone === "danger" }} style={{ clipPath: state.indeterminate ? undefined : `inset(0 ${100 * (1 - level)}% 0 0 round var(--onyx-radius-full))` }} onStatus={setStatus} />, target)}
  </div>;
});
