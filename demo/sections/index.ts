// Every component's demo section, in page order. Add one line per component.
// ?c=<id>[,<id>…] shows only those sections (tests and screenshots use it).
import type * as React from "react";
import SwitchSection from "./switch";
import CheckboxSection from "./checkbox";
import RadioGroupSection from "./radio-group";
import ToggleSection from "./toggle";
import TabsSection from "./tabs";
import ToggleGroupSection from "./toggle-group";
import SectionSelectSection from "./section-select";
import SliderSection from "./slider";
import PasswordFieldSection from "./password-field";
import CollapsibleSection from "./collapsible";
import AccordionSection from "./accordion";
import ToastSection from "./toast";
import AlertSection from "./alert";

export const SECTIONS: { id: string; Component: React.ComponentType }[] = [
  { id: "switch", Component: SwitchSection },
  { id: "checkbox", Component: CheckboxSection },
  { id: "radio-group", Component: RadioGroupSection },
  { id: "toggle", Component: ToggleSection },
  { id: "tabs", Component: TabsSection },
  { id: "toggle-group", Component: ToggleGroupSection },
  { id: "section-select", Component: SectionSelectSection },
  { id: "slider", Component: SliderSection },
  { id: "password-field", Component: PasswordFieldSection },
  { id: "collapsible", Component: CollapsibleSection },
  { id: "accordion", Component: AccordionSection },
  { id: "toast", Component: ToastSection },
  { id: "alert", Component: AlertSection },
];
