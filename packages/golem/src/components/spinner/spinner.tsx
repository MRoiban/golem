import * as React from "react";
import { createPortal } from "react-dom";
import { Spinner as OnyxSpinner, type SpinnerProps as OnyxSpinnerProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState, useMergedRef } from "../shared";
export type SpinnerProps = OnyxSpinnerProps;
/** Onyx owns the status/name and size; the decorative arc inherits its foreground. */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(props, ref) {
  const local = React.useRef<HTMLSpanElement | null>(null);
  const merged = useMergedRef(local, ref);
  const [target, setTarget] = React.useState<HTMLSpanElement | null>(null);
  const setRef = React.useCallback((node: HTMLSpanElement | null) => { merged(node); setTarget(node); }, [merged]);
  const size = useDomState(local, ["data-size"], node => node.getAttribute("data-size"), "md");
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  return <span className="golem-spinner golem-part" data-golem-part="spinner" data-anima={status}>
    <OnyxSpinner {...props} ref={setRef} />
    {target && createPortal(<AnimaControl scene="spinner" className="golem-part__motion golem-spinner__motion" inputs={{ xs: size === "xs", sm: size === "sm", lg: size === "lg" }} onStatus={setStatus} />, target)}
  </span>;
});
