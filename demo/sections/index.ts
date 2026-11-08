// Every component's demo section, in page order. Add one line per component.
// ?c=<id>[,<id>…] shows only those sections (tests and screenshots use it).
import type * as React from "react";
import ButtonSection from "./button";
import SpinnerSection from "./spinner";
import ProgressSection from "./progress";
import MeterSection from "./meter";
import SwitchSection from "./switch";
import SliderSection from "./slider";
import PasswordFieldSection from "./password-field";

export const SECTIONS: { id: string; Component: React.ComponentType }[] = [
  { id: "switch", Component: SwitchSection },
  { id: "meter", Component: MeterSection },
  { id: "progress", Component: ProgressSection },
  { id: "spinner", Component: SpinnerSection },
  { id: "button", Component: ButtonSection },
  { id: "slider", Component: SliderSection },
  { id: "password-field", Component: PasswordFieldSection },
];
