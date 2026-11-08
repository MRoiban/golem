import * as React from "react";
import { Switch as OnyxSwitch, type SwitchProps as OnyxSwitchProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../anima";

export type SwitchProps = OnyxSwitchProps;

/**
 * Onyx's Switch with an Anima motion part: the thumb stretches as it travels and squashes while
 * pressed. The Onyx <button role="switch"> stays in place and owns everything a user or assistive
 * technology touches (role, aria-checked, focus ring, keyboard, Field wiring, form reset); the Anima
 * drawing is aria-hidden, takes no input and only replaces how track and thumb are painted. With
 * motion off, Anima absent or still loading, the plain Onyx switch is what shows.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const button = React.useRef<HTMLButtonElement | null>(null);
  const setRefs = React.useCallback((node: HTMLButtonElement | null) => {
    button.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  // The Onyx button is the source of truth: follow its aria-checked, whoever changes it.
  const [checked, setChecked] = React.useState(Boolean(props.checked ?? props.defaultChecked));
  React.useLayoutEffect(() => {
    const el = button.current;
    if (!el) return;
    const read = () => setChecked(el.getAttribute("aria-checked") === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["aria-checked"] });
    return () => mo.disconnect();
  }, []);

  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const [down, setDown] = React.useState(false);
  const anima = React.useRef<AnimaHandle>(null);
  const last = React.useRef(checked);
  React.useEffect(() => {
    if (last.current !== checked && status === "ready") anima.current?.fire("pop");
    last.current = checked;
  }, [checked, status]);

  const release = () => setDown(false);
  return (
    <span
      className="golem-switch"
      data-anima={status}
      data-disabled={props.disabled ? "" : undefined}
      onPointerDown={(e) => { if (!props.disabled && e.button === 0) setDown(true); }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      <OnyxSwitch ref={setRefs} {...props} />
      <AnimaControl ref={anima} scene="switch" className="golem-switch__motion"
        inputs={{ on: checked, down }} onStatus={setStatus} />
    </span>
  );
});
