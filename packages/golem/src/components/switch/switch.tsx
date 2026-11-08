import * as React from "react";
import { Switch as OnyxSwitch, type SwitchProps as OnyxSwitchProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../../anima";
import { useDomState, useFireOnChange, useMergedRef, usePress } from "../shared";

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
  const setRefs = useMergedRef(button, ref);
  const checked = useDomState(button, ["aria-checked"], (b) => b.getAttribute("aria-checked") === "true",
    Boolean(props.checked ?? props.defaultChecked));
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const press = usePress(props.disabled);
  const anima = React.useRef<AnimaHandle>(null);
  useFireOnChange(checked, status === "ready", () => anima.current?.fire("pop"));

  return (
    <span className="golem-switch golem-part" data-golem-part="switch" data-anima={status}
      data-disabled={props.disabled ? "" : undefined} {...press.handlers}>
      <OnyxSwitch ref={setRefs} {...props} />
      <AnimaControl ref={anima} scene="switch" className="golem-part__motion golem-switch__motion"
        inputs={{ on: checked, down: press.down }} onStatus={setStatus} />
    </span>
  );
});
