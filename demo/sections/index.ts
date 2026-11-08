// Every component's demo section, in page order. Add one line per component.
// ?c=<id>[,<id>…] shows only those sections (tests and screenshots use it).
import type * as React from "react";
import SwitchSection from "./switch";
import CheckboxSection from "./checkbox";
import RadioGroupSection from "./radio-group";
import ToggleSection from "./toggle";

export const SECTIONS: { id: string; Component: React.ComponentType }[] = [
  { id: "switch", Component: SwitchSection },
  { id: "checkbox", Component: CheckboxSection },
  { id: "radio-group", Component: RadioGroupSection },
  { id: "toggle", Component: ToggleSection },
];
