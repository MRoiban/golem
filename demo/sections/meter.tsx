import * as React from "react";
import { Meter as OnyxMeter, Button } from "@mroiban/onyx";
import { Meter } from "@mroiban/golem";
import { Section } from "../ui";
export default function MeterSection() {
  const [value, setValue] = React.useState(20);
  return <Section id="meter" title="Meter" description="The fill eases to the DOM value; tone layers cross-fade at Onyx's low and high thresholds.">
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
    <label htmlFor="meter-value">Usage: {value}%</label>
    <input id="meter-value" type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))} />
    <Button onClick={() => setValue(v => v === 90 ? 20 : 90)}>Change meter</Button>
    <Meter value={value} low={40} high={75} optimum={10} label="Usage" data-testid="controlled" />
    {[20, 60, 90].map(v => <Meter key={v} value={v} low={40} high={75} optimum={10} label={`${v < 40 ? "Low" : v < 75 ? "Medium" : "High"} usage`} data-testid={`value-${v}`} />)}
    <Meter value={60} min={20} max={80} tone="info" aria-label="Custom range" data-testid="custom" />
    <Meter value={50} tone="neutral" label="Explicit neutral" data-testid="neutral" />
    <p>Plain Onyx (reference)</p><OnyxMeter value={value} low={40} high={75} optimum={10} label="Plain usage" data-testid="plain" />
    </div>
  </Section>;
}
