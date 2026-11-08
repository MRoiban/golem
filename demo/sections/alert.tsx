import * as React from "react";
import * as Onyx from "@mroiban/onyx";
import { Alert } from "@mroiban/golem";
import { Section } from "../ui";
const tones = ["neutral", "info", "success", "warning", "danger"] as const;
export default function AlertSection() {
  const [tone, setTone] = React.useState<"info" | "success">("info");
  const [renders, tick] = React.useReducer(n => n + 1, 0);
  return <Section id="alert" title="Alert" description="Tone icons draw once on mount. Onyx owns urgency, actions and dismissal.">
    {tones.map(tone => <Alert key={tone} data-testid={tone} tone={tone} title={`${tone[0]!.toUpperCase()}${tone.slice(1)} alert`} description="Your project stays in sync." />)}
    <Alert tone={tone} data-testid="controlled" title="Controlled tone" description={`Parent renders: ${renders}`} actions={<Onyx.Button disabled>Unavailable action</Onyx.Button>} />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Onyx.Button onClick={() => setTone(t => t === "info" ? "success" : "info")}>Change tone</Onyx.Button><Onyx.Button onClick={tick}>Re-render alert</Onyx.Button></div>
    <Alert tone="warning" data-testid="dismissible" title="Dismissible alert" dismissible />
    <Alert icon={null} data-testid="custom" title="Caller-owned icon (hidden)" />
    <Onyx.Alert tone="success" data-testid="plain" title="Plain Onyx (reference)" description="Original icon, same tone foreground." />
  </Section>;
}
