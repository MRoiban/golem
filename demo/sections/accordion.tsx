import * as React from "react";
import * as Onyx from "@mroiban/onyx";
import { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent } from "@mroiban/golem";
import { Section } from "../ui";

function Item({ value, title, disabled = false }: { value: string; title: string; disabled?: boolean }) {
  return <AccordionItem value={value} disabled={disabled}><AccordionHeader><AccordionTrigger data-testid={value} meta={disabled ? "Locked" : undefined}>{title}</AccordionTrigger></AccordionHeader><AccordionContent>Settings for {title.toLowerCase()}.</AccordionContent></AccordionItem>;
}
export default function AccordionSection() {
  const [value, setValue] = React.useState("general");
  return <Section id="accordion" title="Accordion" description="One DOM-driven chevron per trigger, for single and multiple selections.">
    <p>Single · controlled</p>
    <Accordion type="single" collapsible value={value} onValueChange={setValue} aria-label="Single settings">
      <Item value="general" title="General"/><Item value="locked" title="Managed" disabled/><Item value="advanced" title="Advanced"/>
    </Accordion>
    <Onyx.Button onClick={() => setValue(v => v === "advanced" ? "general" : "advanced")}>Change controlled item</Onyx.Button>
    <p>Multiple · independent items</p>
    <Accordion type="multiple" defaultValue={["files"]} aria-label="Multiple settings"><Item value="files" title="Files"/><Item value="history" title="History"/></Accordion>
    <p>Plain Onyx (reference)</p>
    <Onyx.Accordion type="single" defaultValue="plain"><Onyx.AccordionItem value="plain"><Onyx.AccordionHeader><Onyx.AccordionTrigger data-testid="plain">Original settings</Onyx.AccordionTrigger></Onyx.AccordionHeader><Onyx.AccordionContent>Original geometry and height motion.</Onyx.AccordionContent></Onyx.AccordionItem></Onyx.Accordion>
  </Section>;
}
