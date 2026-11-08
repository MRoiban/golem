import * as React from "react";
import { TabsList as OnyxTabsList } from "@mroiban/onyx";
import { type AnimaStatus } from "../../anima";
import { useMergedRef } from "../shared";
import { SelectionMotion } from "../indicators/selection";
export {
  Tabs,
  TabsTrigger,
  TabsContent,
  TabClose,
  TabBadge,
} from "@mroiban/onyx";
export type {
  TabsProps,
  TabsTriggerProps,
  TabsContentProps,
} from "@mroiban/onyx";
export type TabsListProps = React.ComponentPropsWithoutRef<typeof OnyxTabsList>;
/** Onyx owns the tabs and panels. One decorative part measures the selected trigger. */
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ children, className, ...props }, ref) {
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
    const motion = target && (
      <SelectionMotion
        target={target}
        scene="tabs"
        selector='[data-slot="tabs-trigger"][aria-selected="true"]'
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
      <OnyxTabsList
        {...props}
        ref={setRef}
        className={["golem-tabs-list golem-part", className]
          .filter(Boolean)
          .join(" ")}
        data-golem-part="tabs"
        data-anima={status}
      >
        {content}
      </OnyxTabsList>
    );
  },
);
