import * as React from "react";
import { Checkbox as OnyxCheckbox } from "@mroiban/onyx";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../../anima";
import { useDomState, useFireOnChange, useMergedRef, usePress } from "../shared";

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof OnyxCheckbox>;

/** Native Onyx input semantics, with a decorative box and articulated check/dash stroke. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  const input = React.useRef<HTMLInputElement | null>(null);
  const refs = useMergedRef(input, ref);
  const state = useDomState(input, ["data-state", "aria-checked", "disabled"], (el) => ({
    on: el.getAttribute("data-state") !== "unchecked",
    mixed: el.getAttribute("data-state") === "indeterminate",
    disabled: el.disabled,
  }), { on: Boolean(props.checked ?? props.defaultChecked) || props["aria-checked"] === "mixed",
    mixed: props["aria-checked"] === "mixed", disabled: Boolean(props.disabled) });
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const press = usePress(state.disabled);
  const anima = React.useRef<AnimaHandle>(null);
  useFireOnChange(state.on, status === "ready", () => { if (state.on) anima.current?.fire("pop"); });
  return (
    <span className="golem-checkbox golem-part" data-golem-part="checkbox" data-anima={status}
      data-disabled={state.disabled ? "" : undefined} {...press.handlers}>
      <OnyxCheckbox {...props} ref={refs} />
      <AnimaControl ref={anima} scene="checkbox" className="golem-part__motion golem-checkbox__motion"
        inputs={{ on: state.on, mixed: state.mixed, down: press.down }} onStatus={setStatus} />
    </span>
  );
});
