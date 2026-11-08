import * as React from "react";
import { createPortal } from "react-dom";
import { PasswordField as OnyxPasswordField, type PasswordFieldProps as OnyxPasswordFieldProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState, useMergedRef } from "../shared";

export type PasswordFieldProps = OnyxPasswordFieldProps;

/** Only the existing toggle's icon is replaced. Onyx owns input type and accessible state. */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
  const input = React.useRef<HTMLInputElement | null>(null);
  const setRefs = useMergedRef(input, ref);
  const revealed = useDomState(input, ["type"], (el) => el.type === "text", Boolean(props.revealed ?? props.defaultRevealed));
  const [glyph, setGlyph] = React.useState<HTMLElement | null>(null);
  const [button, setButton] = React.useState<HTMLButtonElement | null>(null);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  React.useLayoutEffect(() => {
    const toggle = input.current?.closest("[data-slot='password-field']")?.querySelector<HTMLButtonElement>("[data-slot='input-group-button']") ?? null;
    setButton(toggle);
    setGlyph(toggle?.querySelector<HTMLElement>("[data-slot='icon']") ?? null);
  }, []);
  React.useLayoutEffect(() => {
    if (!button) return;
    button.dataset.golemEye = status;
    return () => { delete button.dataset.golemEye; };
  }, [button, status]);
  return <div className="golem-password-field golem-part" data-golem-part="password-field" data-anima={status}>
    <OnyxPasswordField ref={setRefs} {...props} />
    {glyph && createPortal(<AnimaControl scene="password-field" className="golem-part__motion golem-password-field__motion"
      inputs={{ closed: revealed }} onStatus={setStatus} />, glyph)}
  </div>;
});
