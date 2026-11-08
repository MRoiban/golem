import * as React from "react";
import {
  ToggleGroup as OnyxToggleGroup,
  type ToggleGroupProps as OnyxToggleGroupProps,
} from "@mroiban/onyx";
import { type AnimaStatus } from "../../anima";
import { useMergedRef } from "../shared";
import { SelectionMotion } from "../indicators/selection";
export { ToggleGroupItem } from "@mroiban/onyx";
export type ToggleGroupProps = OnyxToggleGroupProps;
/** Multiple selection deliberately retains Onyx: several independent selected items have no
 * single travelling pill. Single selection keeps Radix/Onyx keyboard, reset and field wiring. */
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  function ToggleGroup({ children, className, ...props }, ref) {
    const local = React.useRef<HTMLDivElement | null>(null);
    const merged = useMergedRef(local, ref);
    const [target, setTarget] = React.useState<HTMLDivElement | null>(null);
    const [status, setStatus] = React.useState<AnimaStatus>("off");
    const setRef = React.useCallback(
      (el: HTMLDivElement | null) => {
        merged(el);
        setTarget(el);
      },
      [merged],
    );
    const single = props.type === "single";
    const motion = single && target && (
      <SelectionMotion
        target={target}
        scene="toggle-group"
        selector='[data-slot="toggle-group-item"][data-state="on"]'
        onStatus={setStatus}
      />
    );
    // Preserve the primitive's asChild contract: Slot must still receive exactly one child.
    const content =
      props.asChild &&
      React.isValidElement<{ children?: React.ReactNode }>(children) ? (
        React.cloneElement(children, {}, children.props.children, motion)
      ) : (
        <>
          {children}
          {motion}
        </>
      );
    return (
      <OnyxToggleGroup
        {...props}
        ref={setRef}
        className={["golem-toggle-group", single && "golem-part", className]
          .filter(Boolean)
          .join(" ")}
        data-golem-part={single ? "toggle-group" : undefined}
        data-anima={single ? status : "off"}
      >
        {content}
      </OnyxToggleGroup>
    );
  },
);
