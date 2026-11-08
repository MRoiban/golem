import * as React from "react";
import * as Onyx from "@mroiban/onyx";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@mroiban/golem";
import { Section } from "../ui";

export default function CollapsibleSection() {
  const [open, setOpen] = React.useState(true);
  return <Section id="collapsible" title="Collapsible" description="Onyx's chevron turns with a small overshoot; content keeps Onyx's height animation.">
    <Collapsible><CollapsibleTrigger data-testid="basic">Project details</CollapsibleTrigger><CollapsibleContent>Notes, files and recent changes.</CollapsibleContent></Collapsible>
    <Collapsible open={open} onOpenChange={setOpen}><CollapsibleTrigger data-testid="controlled">Controlled details</CollapsibleTrigger><CollapsibleContent>Synced with the button below.</CollapsibleContent></Collapsible>
    <Onyx.Button onClick={() => setOpen(v => !v)}>Toggle controlled</Onyx.Button>
    <Collapsible disabled defaultOpen><CollapsibleTrigger data-testid="disabled">Managed details</CollapsibleTrigger><CollapsibleContent>Managed by your organisation.</CollapsibleContent></Collapsible>
    <Collapsible><CollapsibleTrigger asChild><button data-testid="custom">Custom trigger</button></CollapsibleTrigger><CollapsibleContent>Caller-owned trigger, plain Onyx.</CollapsibleContent></Collapsible>
    <Onyx.Collapsible defaultOpen><Onyx.CollapsibleTrigger data-testid="plain">Plain Onyx (reference)</Onyx.CollapsibleTrigger><Onyx.CollapsibleContent>Original geometry and content motion.</Onyx.CollapsibleContent></Onyx.Collapsible>
  </Section>;
}
