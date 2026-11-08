// Every component's demo section, in page order. Add one line per component.
// ?c=<id>[,<id>…] shows only those sections (tests and screenshots use it).
import type * as React from "react";
import TabsSection from "./tabs";
import ToggleGroupSection from "./toggle-group";
import SectionSelectSection from "./section-select";
import SwitchSection from "./switch";

export const SECTIONS: { id: string; Component: React.ComponentType }[] = [
  { id: "switch", Component: SwitchSection },
  { id: "tabs", Component: TabsSection },
  { id: "toggle-group", Component: ToggleGroupSection },
  { id: "section-select", Component: SectionSelectSection },
];
