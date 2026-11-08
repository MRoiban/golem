import * as React from "react";
import { Alert as OnyxAlert, Icon, type AlertProps as OnyxAlertProps } from "@mroiban/onyx";
import { useDomState, useMergedRef } from "../shared";
import { ToneIcon, type Tone } from "./tone-icon";

export { AlertTitle, AlertDescription, AlertActions, useAlert } from "@mroiban/onyx";
export type AlertProps = OnyxAlertProps;
const icons = { neutral: "info", info: "info", success: "pass", warning: "warning", danger: "error" };
/** A custom icon (including null) and asChild remain entirely caller-owned. */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  const root = React.useRef<HTMLDivElement | null>(null);
  const refs = useMergedRef(root, ref);
  const tone = useDomState(root, ["data-tone"], el => (el.getAttribute("data-tone") ?? "info") as Tone, props.tone ?? "info");
  return <OnyxAlert {...props} ref={refs} icon={props.icon === undefined && !props.asChild
    ? <ToneIcon tone={tone} scene="alert" fallback={<Icon name={icons[tone]} />} /> : props.icon} />;
});
