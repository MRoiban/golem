import * as React from "react";
import { Slider as OnyxSlider } from "@mroiban/onyx";
import { Slider } from "@mroiban/golem";
import { Section } from "../ui";

const row: React.CSSProperties = { display: "grid", gap: 8, padding: "12px 0", borderBottom: "1px solid var(--onyx-border-subtle)" };
export default function SliderSection() {
  const [value, setValue] = React.useState([60]);
  return <Section id="slider" title="Slider" description="Onyx positions each thumb directly. Anima adds a drag squash and a small keyboard pop.">
    <form style={row} onSubmit={(e) => e.preventDefault()}><span>Volume</span><Slider aria-label="Volume" name="volume" defaultValue={[35]} showValue data-testid="single" /><button type="reset">Reset volume</button></form>
    <div style={row}><span>Price range</span><Slider defaultValue={[25, 75]} thumbLabels={["Minimum price", "Maximum price"]} showValue data-testid="range" /></div>
    <div style={row}><span>Steps of 10</span><Slider aria-label="Steps" defaultValue={[30]} step={10} showValue data-testid="stepped" /></div>
    <div style={row}><span>Controlled · {value[0]}</span><Slider aria-label="Controlled level" value={value} onValueChange={setValue} showValue data-testid="controlled" /><button type="button" onClick={() => setValue([80])}>Set level to 80</button></div>
    <div style={row}><span>Locked</span><Slider aria-label="Locked level" defaultValue={[45]} disabled showValue data-testid="disabled" /></div>
    <div style={row}><span>Vertical</span><Slider aria-label="Vertical level" orientation="vertical" defaultValue={[40]} showValue data-testid="vertical" /></div>
    <div style={row}><span>Plain Onyx (reference)</span><OnyxSlider aria-label="Plain Onyx level" defaultValue={[35]} showValue data-testid="plain" /></div>
  </Section>;
}
