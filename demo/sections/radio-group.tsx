import * as React from "react";
import { RadioGroup as OnyxRadioGroup, RadioGroupItem as OnyxRadioGroupItem } from "@mroiban/onyx";
import { RadioGroup, RadioGroupItem } from "@mroiban/golem";
import { Section } from "../ui";

export default function RadioGroupSection() {
  const [value, setValue] = React.useState("balanced");
  return (
    <Section id="radio-group" title="Radio group" description="Onyx owns arrow navigation; each selected dot grows with a small overshoot while the previous dot shrinks.">
      <form data-testid="radio-form">
        <RadioGroup aria-label="Quality" defaultValue="balanced" name="quality" data-testid="radio-quality">
          <RadioGroupItem value="fast" data-testid="radio-fast">Fast</RadioGroupItem>
          <RadioGroupItem value="locked" disabled data-testid="radio-disabled">Managed (disabled)</RadioGroupItem>
          <RadioGroupItem value="balanced" data-testid="radio-balanced">Balanced</RadioGroupItem>
          <RadioGroupItem value="best" data-testid="radio-best">Best quality</RadioGroupItem>
        </RadioGroup>
        <button type="reset">Reset radio</button>
      </form>
      <p>Controlled: {value}.</p>
      <RadioGroup aria-label="Controlled quality" value={value} onValueChange={setValue}>
        <RadioGroupItem value="balanced" data-testid="radio-controlled-balanced">Balanced control</RadioGroupItem>
        <RadioGroupItem value="best" data-testid="radio-controlled-best">Best control</RadioGroupItem>
      </RadioGroup>
      <button type="button" onClick={() => setValue(value === "best" ? "balanced" : "best")}>Change quality</button>
      <RadioGroup aria-label="Card quality" variant="card" defaultValue="standard">
        <RadioGroupItem value="standard" data-testid="radio-card">Standard card</RadioGroupItem>
        <RadioGroupItem value="premium">Premium card</RadioGroupItem>
      </RadioGroup>
      <p>Plain Onyx (reference)</p>
      <OnyxRadioGroup aria-label="Plain quality" defaultValue="balanced">
        <OnyxRadioGroupItem value="fast">Fast reference</OnyxRadioGroupItem>
        <OnyxRadioGroupItem value="balanced" data-testid="radio-plain">Balanced reference</OnyxRadioGroupItem>
      </OnyxRadioGroup>
    </Section>
  );
}
