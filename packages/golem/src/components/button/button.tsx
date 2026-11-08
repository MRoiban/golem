import * as React from "react";
import { createPortal } from "react-dom";
import { Button as OnyxButton, type ButtonProps as OnyxButtonProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../../anima";
import { useDomState, useFireOnChange, useMergedRef, usePress } from "../shared";
// Decorative press/status updates must not rerender Onyx: its loading-width snapshot uses
// getBoundingClientRect(), which includes a press transform. Caller prop changes still pass through.
const ButtonPrimitive = React.memo(OnyxButton);
export type ButtonProps = OnyxButtonProps & { /** Persists until the caller clears it. */ result?: "success" | "error" };
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ result, ...props }, ref) {
  const button = React.useRef<HTMLButtonElement | null>(null);
  const merged = useMergedRef(button, ref);
  const [target, setTarget] = React.useState<HTMLButtonElement | null>(null);
  const setRef = React.useCallback((node: HTMLButtonElement | null) => { merged(node); setTarget(node); }, [merged]);
  const loading = useDomState(button, ["aria-busy"], b => b.getAttribute("aria-busy") === "true", false);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const press = usePress(props.disabled || loading);
  const anima = React.useRef<AnimaHandle>(null);
  useFireOnChange(result, status === "ready", () => { if (result) anima.current?.fire("reveal"); });
  // The loading glyph uses the actual slot Onyx laid out, including custom padding and icon sizes.
  React.useLayoutEffect(() => {
    const b = button.current;
    if (!b) return;
    const place = () => {
      const slot = b.querySelector<HTMLElement>("[data-slot='button-spinner']");
      b.style.setProperty("--golem-button-glyph-x", slot ? `${slot.offsetLeft + slot.offsetWidth / 2}px` : "50%");
      b.style.setProperty("--golem-button-glyph-size", slot ? `${slot.offsetWidth}px` : "14px");
    };
    place();
    const ro = new ResizeObserver(place); ro.observe(b);
    return () => ro.disconnect();
  }, [loading, target, props.size]);
  return <span className="golem-button golem-part" data-golem-part="button" data-anima={status}
    data-result={result} data-loading={loading ? "" : undefined} data-down={press.down ? "" : undefined} {...press.handlers}>
    <ButtonPrimitive {...props} ref={setRef} />
    {target && createPortal(<AnimaControl ref={anima} scene="button" className="golem-part__motion golem-button__motion"
      inputs={{ busy: loading && !result, success: result === "success", error: result === "error" }} onStatus={setStatus} />, target)}
    <span className="golem-button__announcement" role="status" aria-live="polite" aria-atomic="true">{result === "success" ? "Success" : result === "error" ? "Error" : ""}</span>
  </span>;
});
