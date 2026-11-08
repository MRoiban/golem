import * as React from "react";
import { Toggle as OnyxToggle, type ToggleProps as OnyxToggleProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState, useMergedRef, usePress } from "../shared";

export type ToggleProps = OnyxToggleProps;

/** Only the pressed background moves; Onyx's original children remain crisp above it. */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(props, ref) {
  const button = React.useRef<HTMLButtonElement | null>(null);
  const refs = useMergedRef(button, ref);
  const state = useDomState(button, ["data-state", "aria-pressed", "disabled"], (el) => ({
    on: el.getAttribute("data-state") === "on" || el.getAttribute("aria-pressed") === "true",
    disabled: el.disabled,
  }), { on: Boolean(props.pressed ?? props.defaultPressed), disabled: Boolean(props.disabled) });
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const press = usePress(state.disabled);
  return (
    <span className="golem-toggle golem-part" data-golem-part="toggle" data-anima={status}
      data-disabled={state.disabled ? "" : undefined} {...press.handlers}>
      <OnyxToggle {...props} ref={refs} />
      <AnimaControl scene="toggle" className="golem-part__motion golem-toggle__motion"
        inputs={{ on: state.on, down: press.down }} onStatus={setStatus} />
    </span>
  );
});
