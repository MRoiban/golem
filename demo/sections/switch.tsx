import * as React from "react";
import { Switch as OnyxSwitch } from "@mroiban/onyx";
import { Switch } from "@mroiban/golem";
import { Section, SettingRow } from "../ui";

export default function SwitchSection() {
  const [sync, setSync] = React.useState(true);
  return (
    <Section id="switch" title="Switch" description="Onyx's switch; with Anima motion the thumb stretches as it travels and squashes while pressed.">
      <SettingRow id="autosave" label="Auto save" description="Save changes as you type.">
        <Switch defaultChecked data-testid="autosave" />
      </SettingRow>
      <SettingRow id="sync" label="Sync" description={`Controlled: ${sync ? "on" : "off"}.`}>
        <Switch checked={sync} onCheckedChange={setSync} data-testid="sync" />
      </SettingRow>
      <SettingRow id="beta" label="Beta features" description="Off by default.">
        <Switch data-testid="beta" />
      </SettingRow>
      <SettingRow id="locked" label="Managed by your organisation" description="Disabled.">
        <Switch defaultChecked disabled data-testid="locked" />
      </SettingRow>
      <SettingRow id="plain" label="Plain Onyx (reference)" description="The primitive Golem wraps, never animated by Anima.">
        <OnyxSwitch defaultChecked data-testid="plain" />
      </SettingRow>
    </Section>
  );
}
