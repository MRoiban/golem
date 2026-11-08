// Small layout pieces shared by the demo sections.
import * as React from "react";
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Field, FieldDescription, Label, ToggleGroup, ToggleGroupItem } from "@mroiban/onyx";

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      <span className="seg-label" id={`seg-${label}`}>{label}</span>
      <ToggleGroup type="single" aria-labelledby={`seg-${label}`} value={value}
        onValueChange={(v: string) => { if (v) onChange(v as T); }}>
        {options.map(([v, text]) => <ToggleGroupItem key={v} value={v}>{text}</ToggleGroupItem>)}
      </ToggleGroup>
    </div>
  );
}

/** A labelled row: text on the left, the control on the right. */
export function SettingRow({ id, label, description, children }: { id: string; label: string; description: string; children: React.ReactNode }) {
  return (
    <Field className="row" id={id}>
      <div className="row-text">
        <Label>{label}</Label>
        <FieldDescription>{description}</FieldDescription>
      </div>
      {children}
    </Field>
  );
}

/** One demo card per component; `id` becomes data-testid="section-<id>" (screenshots crop to it). */
export function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="card" data-testid={`section-${id}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardBody className="rows">{children}</CardBody>
    </Card>
  );
}
