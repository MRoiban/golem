import * as React from "react";
import { AccordionTrigger as OnyxTrigger } from "@mroiban/onyx";
import { useMergedRef } from "../shared";
import { useChevron } from "../collapsible/chevron";

export { Accordion, AccordionItem, AccordionHeader, AccordionContent, useAccordion } from "@mroiban/onyx";
export type AccordionProps = React.ComponentPropsWithoutRef<typeof import("@mroiban/onyx").Accordion>;
export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof import("@mroiban/onyx").AccordionItem>;
export type AccordionContentProps = React.ComponentPropsWithoutRef<typeof import("@mroiban/onyx").AccordionContent>;
export type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof OnyxTrigger>;
/** Works with single and multiple Onyx roots; the trigger DOM is the only motion input. */
// Annotated so declaration emit names Onyx's public type, not Radix's internal path (TS2742).
export const AccordionTrigger: React.ForwardRefExoticComponent<AccordionTriggerProps & React.RefAttributes<HTMLButtonElement>> = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(function AccordionTrigger(props, ref) {
  const button = React.useRef<HTMLButtonElement | null>(null);
  const refs = useMergedRef(button, ref);
  const part = useChevron(button, "accordion", props.asChild);
  return <><OnyxTrigger {...props} ref={refs} {...part.attributes} />{part.drawing}</>;
});
