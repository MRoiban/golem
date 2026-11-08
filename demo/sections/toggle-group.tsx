import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@mroiban/golem";
import {
  ToggleGroup as PlainGroup,
  ToggleGroupItem as PlainItem,
} from "@mroiban/onyx";
import { Section } from "../ui";
const items: [string, string][] = [
  ["day", "Day"],
  ["week", "Week view"],
  ["month", "Month"],
  ["locked", "Locked"],
];
export default function ToggleGroupSection() {
  const [value, setValue] = React.useState("week");
  return (
    <Section
      id="toggle-group"
      title="Toggle group"
      description="Single selection travels between measured items. Multiple selection retains Onyx's independent backgrounds."
    >
      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        <p>Single selection (click again to clear)</p>
        <ToggleGroup
          type="single"
          defaultValue="day"
          aria-label="Calendar view"
          data-testid="toggle-basic"
        >
          {items.map(([v, text]) => (
            <ToggleGroupItem key={v} value={v} disabled={v === "locked"}>
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p>
          Controlled: {value || "none"}.{" "}
          <button
            data-testid="toggle-external"
            onClick={() => setValue("month")}
          >
            Show month
          </button>
        </p>
        <ToggleGroup
          type="single"
          value={value}
          onValueChange={setValue}
          aria-label="Controlled view"
          data-testid="toggle-controlled"
        >
          {items.slice(0, 3).map(([v, text]) => (
            <ToggleGroupItem key={v} value={v}>
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p>Multiple selection</p>
        <ToggleGroup
          type="multiple"
          defaultValue={["bold"]}
          aria-label="Formatting"
          data-testid="toggle-multiple"
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          <ToggleGroupItem value="strike" disabled>
            Strike
          </ToggleGroupItem>
        </ToggleGroup>
        <p>Vertical</p>
        <ToggleGroup
          type="single"
          orientation="vertical"
          defaultValue="day"
          aria-label="Vertical view"
          data-testid="toggle-vertical"
        >
          {items.slice(0, 3).map(([v, text]) => (
            <ToggleGroupItem key={v} value={v}>
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <form data-testid="toggle-form">
          <p>Form reset</p>
          <ToggleGroup
            type="single"
            name="view"
            defaultValue="day"
            aria-label="Saved view"
          >
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
          </ToggleGroup>
          <button type="reset">Reset view</button>
        </form>
        <p>Plain Onyx reference</p>
        <PlainGroup
          type="single"
          defaultValue="day"
          aria-label="Reference view"
          data-testid="toggle-plain"
        >
          {items.map(([v, text]) => (
            <PlainItem key={v} value={v} disabled={v === "locked"}>
              {text}
            </PlainItem>
          ))}
        </PlainGroup>
      </div>
    </Section>
  );
}
