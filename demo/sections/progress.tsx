import * as React from "react";
import { Progress as OnyxProgress, Button } from "@mroiban/onyx";
import { Progress } from "@mroiban/golem";
import { Section } from "../ui";
export default function ProgressSection() {
  const [value, setValue] = React.useState(35);
  return <Section id="progress" title="Progress" description="The fill eases to Onyx's value in 240 ms. Indeterminate progress sweeps along the same track.">
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
    <label htmlFor="progress-value">Progress value: {value}%</label>
    <input id="progress-value" type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))} />
    <Button onClick={() => setValue(v => v === 85 ? 15 : 85)}>Change progress</Button>
    <Progress value={value} aria-label="Upload" data-testid="controlled" />
    {[0, 25, 70, 100].map(v => <div key={v} style={{ display: "grid", gap: 6 }}><span>{v}%</span><Progress value={v} aria-label={`Progress ${v}`} data-testid={`value-${v}`} /></div>)}
    <Progress value={60} min={20} max={80} tone="success" aria-label="Custom range" data-testid="custom" />
    <span>Connecting…</span>
    <Progress indeterminate aria-label="Connecting" data-testid="indeterminate" />
    <p>Plain Onyx (reference)</p><OnyxProgress value={value} aria-label="Plain progress" data-testid="plain" /><OnyxProgress indeterminate aria-label="Plain connecting" />
    </div>
  </Section>;
}
