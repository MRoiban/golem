import * as React from "react";
import { Checkbox as OnyxCheckbox } from "@mroiban/onyx";
import { Checkbox } from "@mroiban/golem";
import { Section, SettingRow } from "../ui";

export default function CheckboxSection() {
  const [value, setValue] = React.useState<boolean | "mixed">(true);
  return (
    <Section id="checkbox" title="Checkbox" description="Onyx's native input; the box pops, the check draws in and articulates into an indeterminate dash.">
      <SettingRow id="check-off" label="Notifications" description="Unchecked by default."><Checkbox data-testid="check-off" /></SettingRow>
      <SettingRow id="check-on" label="Auto updates" description="Checked on mount."><Checkbox defaultChecked data-testid="check-on" /></SettingRow>
      <SettingRow id="check-mixed" label="Some folders" description="Indeterminate on mount."><Checkbox aria-checked="mixed" data-testid="check-mixed" /></SettingRow>
      <SettingRow id="check-disabled" label="Managed option" description="Disabled and checked."><Checkbox disabled defaultChecked data-testid="check-disabled" /></SettingRow>
      <SettingRow id="check-disabled-off" label="Unavailable option" description="Disabled and unchecked."><Checkbox disabled data-testid="check-disabled-off" /></SettingRow>
      <SettingRow id="check-controlled" label="Sync folders" description={`Controlled: ${String(value)}.`}>
        <Checkbox checked={value === true} aria-checked={value} onChange={(e) => setValue(e.currentTarget.checked)} data-testid="check-controlled" />
      </SettingRow>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setValue(true)}>Set checked</button>
        <button type="button" onClick={() => setValue("mixed")}>Set mixed</button>
        <button type="button" onClick={() => setValue(false)}>Set unchecked</button>
      </div>
      <form data-testid="check-form">
        <SettingRow id="check-reset" label="Resettable checkbox" description="Native form value and reset."><Checkbox name="updates" value="yes" defaultChecked data-testid="check-reset" /></SettingRow>
        <button type="reset">Reset checkbox</button>
      </form>
      <SettingRow id="check-plain" label="Plain Onyx (reference)" description="The same checked native input, without Anima."><OnyxCheckbox defaultChecked data-testid="check-plain" /></SettingRow>
      <SettingRow id="check-plain-mixed" label="Plain Onyx dash" description="The same indeterminate native input."><OnyxCheckbox aria-checked="mixed" data-testid="check-plain-mixed" /></SettingRow>
    </Section>
  );
}
