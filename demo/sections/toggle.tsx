import * as React from "react";
import { Toggle as OnyxToggle } from "@mroiban/onyx";
import { Toggle } from "@mroiban/golem";
import { Section, SettingRow } from "../ui";

function BoldIcon() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 2.5h3.5a2.5 2.5 0 0 1 0 5H5m0 0h4a3 3 0 0 1 0 6H5v-11Z" stroke="currentColor" strokeWidth="1.8" /></svg>;
}
export default function ToggleSection() {
  const [pressed, setPressed] = React.useState(true);
  return (
    <Section id="toggle" title="Toggle" description="The pressed background eases out from the centre and squashes on press. Onyx's text and icons stay crisp above it.">
      <SettingRow id="toggle-icon" label="Bold" description="Icon toggle, off by default."><Toggle data-testid="toggle-icon"><BoldIcon /></Toggle></SettingRow>
      <SettingRow id="toggle-text" label="Preview" description="Text toggle, pressed on mount."><Toggle defaultPressed data-testid="toggle-text">Preview</Toggle></SettingRow>
      <SettingRow id="toggle-controlled" label="Pin panel" description={`Controlled: ${pressed ? "on" : "off"}.`}><Toggle variant="outline" size="md" pressed={pressed} onPressedChange={setPressed} data-testid="toggle-controlled">Pinned</Toggle></SettingRow>
      <button type="button" onClick={() => setPressed((p) => !p)}>Change pressed</button>
      <SettingRow id="toggle-disabled" label="Managed toggle" description="Disabled and pressed."><Toggle disabled defaultPressed data-testid="toggle-disabled">Locked</Toggle></SettingRow>
      <form data-testid="toggle-form">
        <SettingRow id="toggle-reset" label="Resettable toggle" description="Onyx's named form value and reset."><Toggle name="preview" defaultPressed data-testid="toggle-reset">Preview</Toggle></SettingRow>
        <button type="reset">Reset toggle</button>
      </form>
      <SettingRow id="toggle-plain" label="Plain Onyx (reference)" description="Pressed text, without Anima."><OnyxToggle defaultPressed data-testid="toggle-plain">Preview</OnyxToggle></SettingRow>
      <SettingRow id="toggle-plain-icon" label="Plain Onyx icon" description="Unpressed icon, without Anima."><OnyxToggle data-testid="toggle-plain-icon"><BoldIcon /></OnyxToggle></SettingRow>
    </Section>
  );
}
