import * as React from "react";
import { SectionSelect } from "@mroiban/golem";
import { SectionSelect as PlainSectionSelect } from "@mroiban/onyx";
import { Section } from "../ui";
const items = [
  { value: "notes", label: "Notes", icon: "file" },
  { value: "activity", label: "Activity log", icon: "history" },
  { value: "files", label: "Project files", icon: "folder" },
];
export default function SectionSelectSection() {
  const [value, setValue] = React.useState("notes");
  const [plain, setPlain] = React.useState("notes");
  return (
    <Section
      id="section-select"
      title="Section select"
      description="Onyx's popup highlight travels vertically with keyboard focus. The checkmark keeps the committed value; Enter selects and closes."
    >
      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        <p>
          Controlled section: <span data-testid="select-value">{value}</span>.{" "}
          <button
            data-testid="select-external"
            onClick={() => setValue("files")}
          >
            Show files
          </button>
        </p>
        <SectionSelect
          value={value}
          items={items}
          onValueChange={setValue}
          ariaLabel="Project section"
        />
        <p>Plain Onyx reference</p>
        <span style={{ display: "inline-flex" }}>
          <PlainSectionSelect
            value={plain}
            items={items}
            onValueChange={setPlain}
            ariaLabel="Reference section"
          />
        </span>
        <p>
          SectionSelect has no disabled-item API. Its trigger, popup, focus,
          Escape and selection behavior are entirely Onyx's.
        </p>
      </div>
    </Section>
  );
}
