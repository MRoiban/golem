import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@mroiban/golem";
import {
  Tabs as PlainTabs,
  TabsList as PlainList,
  TabsTrigger as PlainTrigger,
  TabsContent as PlainContent,
} from "@mroiban/onyx";
import { Section } from "../ui";
const items: [string, string][] = [
  ["one", "Notes"],
  ["two", "Activity log"],
  ["three", "Files"],
  ["locked", "Locked"],
];
export default function TabsSection() {
  const [value, setValue] = React.useState("two");
  return (
    <Section
      id="tabs"
      title="Tabs"
      description="Measured underlines and editor tabs travel with a leading-edge stretch. Arrows move focus; Enter or Space selects."
    >
      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        <p>Line tabs</p>
        <Tabs variant="line" defaultValue="one" data-testid="tabs-basic">
          <TabsList aria-label="Workspace">
            {items.map(([v, text]) => (
              <TabsTrigger key={v} value={v} disabled={v === "locked"}>
                {text}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="one">
            <p>Project notes and decisions.</p>
          </TabsContent>
          <TabsContent value="two">
            <p>Recent changes from your team.</p>
          </TabsContent>
          <TabsContent value="three">
            <p>Documents attached to this project.</p>
          </TabsContent>
        </Tabs>
        <p>
          Controlled editor tabs: {value}.{" "}
          <button data-testid="tabs-external" onClick={() => setValue("three")}>
            Show files
          </button>
        </p>
        <Tabs
          value={value}
          onValueChange={setValue}
          data-testid="tabs-controlled"
        >
          <TabsList aria-label="Editor">
            {items.map(([v, text]) => (
              <TabsTrigger key={v} value={v} disabled={v === "locked"}>
                {text}
              </TabsTrigger>
            ))}
          </TabsList>
          {items.slice(0, 3).map(([v, text]) => (
            <TabsContent key={v} value={v}>
              <p>{text}: an editable document panel.</p>
            </TabsContent>
          ))}
        </Tabs>
        <p>Plain Onyx reference</p>
        <PlainTabs variant="line" defaultValue="one" data-testid="tabs-plain">
          <PlainList aria-label="Reference tabs">
            {items.map(([v, text]) => (
              <PlainTrigger key={v} value={v} disabled={v === "locked"}>
                {text}
              </PlainTrigger>
            ))}
          </PlainList>
          <PlainContent value="one">
            <p>Project notes and decisions.</p>
          </PlainContent>
        </PlainTabs>
      </div>
    </Section>
  );
}
