// Every component's demo section, in page order. Add one line per component.
// ?c=<id>[,<id>…] shows only those sections (tests and screenshots use it).
import type * as React from "react";
import CollapsibleSection from "./collapsible";
import AccordionSection from "./accordion";
import ToastSection from "./toast";
import AlertSection from "./alert";
import SwitchSection from "./switch";

export const SECTIONS: { id: string; Component: React.ComponentType }[] = [
  { id: "collapsible", Component: CollapsibleSection },
  { id: "accordion", Component: AccordionSection },
  { id: "toast", Component: ToastSection },
  { id: "alert", Component: AlertSection },
  { id: "switch", Component: SwitchSection },
];
