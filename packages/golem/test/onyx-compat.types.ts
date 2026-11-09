// Golem's components replace Onyx's by name in @bedrock/ui (docs/design.md §7), so every prop an
// Onyx component accepts must type-check on its Golem replacement. Checked by `bun run typecheck`;
// a failure names the component. Exports identical to Onyx's need no check (onyx-compat.test.ts).
import type * as React from "react";
import type * as G from "../src";
import type * as O from "@mroiban/onyx";

type Props<C> = C extends React.JSXElementConstructor<infer P> ? P : never;
/** true when every props object Onyx's component accepts is accepted by Golem's. */
type DropIn<Golem, Onyx> = [Props<Onyx>] extends [Props<Golem>] ? true : false;

export const AccordionTrigger: DropIn<typeof G.AccordionTrigger, typeof O.AccordionTrigger> = true;
export const Alert: DropIn<typeof G.Alert, typeof O.Alert> = true;
export const Button: DropIn<typeof G.Button, typeof O.Button> = true;
export const Checkbox: DropIn<typeof G.Checkbox, typeof O.Checkbox> = true;
export const CollapsibleTrigger: DropIn<typeof G.CollapsibleTrigger, typeof O.CollapsibleTrigger> = true;
export const Meter: DropIn<typeof G.Meter, typeof O.Meter> = true;
export const PasswordField: DropIn<typeof G.PasswordField, typeof O.PasswordField> = true;
export const Progress: DropIn<typeof G.Progress, typeof O.Progress> = true;
export const RadioGroupItem: DropIn<typeof G.RadioGroupItem, typeof O.RadioGroupItem> = true;
export const SectionSelect: DropIn<typeof G.SectionSelect, typeof O.SectionSelect> = true;
export const Slider: DropIn<typeof G.Slider, typeof O.Slider> = true;
export const Spinner: DropIn<typeof G.Spinner, typeof O.Spinner> = true;
export const Switch: DropIn<typeof G.Switch, typeof O.Switch> = true;
export const TabsList: DropIn<typeof G.TabsList, typeof O.TabsList> = true;
export const ToastProvider: DropIn<typeof G.ToastProvider, typeof O.ToastProvider> = true;
export const ToastQueueViewport: DropIn<typeof G.ToastQueueViewport, typeof O.ToastQueueViewport> = true;
export const Toggle: DropIn<typeof G.Toggle, typeof O.Toggle> = true;
export const ToggleGroup: DropIn<typeof G.ToggleGroup, typeof O.ToggleGroup> = true;
