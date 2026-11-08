import * as React from "react";
import { CollapsibleTrigger as OnyxTrigger } from "@mroiban/onyx";
import { useMergedRef } from "../shared";
import { useChevron } from "./chevron";

export { Collapsible, CollapsibleContent, useCollapsible } from "@mroiban/onyx";
export type CollapsibleProps = React.ComponentPropsWithoutRef<typeof import("@mroiban/onyx").Collapsible>;
export type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<typeof OnyxTrigger>;
export type CollapsibleContentProps = React.ComponentPropsWithoutRef<typeof import("@mroiban/onyx").CollapsibleContent>;
/** Onyx keeps the trigger, height animation and state. asChild keeps the caller's custom icon. */
export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(function CollapsibleTrigger(props, ref) {
  const button = React.useRef<HTMLButtonElement | null>(null);
  const refs = useMergedRef(button, ref);
  const part = useChevron(button, "collapsible", props.asChild);
  return <><OnyxTrigger {...props} ref={refs} {...part.attributes} />{part.drawing}</>;
});
