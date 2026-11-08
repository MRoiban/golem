import * as React from "react";
import { createPortal } from "react-dom";
import { RadioGroup as OnyxRadioGroup, RadioGroupItem as OnyxRadioGroupItem } from "@mroiban/onyx";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState, useMergedRef } from "../shared";

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof OnyxRadioGroup>;
export type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof OnyxRadioGroupItem>;
// Onyx owns group value, form reset, roving focus and arrow navigation without an adapter.
export const RadioGroup = OnyxRadioGroup;

/** One drawing per item, so Onyx's card/default layouts and independently changing items stay intact. */
export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(function RadioGroupItem(props, ref) {
  const item = React.useRef<HTMLButtonElement | null>(null);
  const refs = useMergedRef(item, ref);
  const on = useDomState(item, ["data-state", "aria-checked"],
    (el) => el.getAttribute("data-state") === "checked" || el.getAttribute("aria-checked") === "true", false);
  const [control, setControl] = React.useState<HTMLElement | null>(null);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  React.useLayoutEffect(() => {
    setControl(item.current?.querySelector<HTMLElement>("[data-slot='radio-group-control']") ?? null);
  }, [props.asChild]);
  return (
    <span className="golem-radio-group-item golem-part" data-golem-part="radio-group" data-anima={status}>
      <OnyxRadioGroupItem {...props} ref={refs} />
      {control && createPortal(<AnimaControl scene="radio-group" className="golem-part__motion golem-radio-group-item__motion"
        inputs={{ on }} onStatus={setStatus} />, control)}
    </span>
  );
});
