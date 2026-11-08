import { Spinner as OnyxSpinner } from "@mroiban/onyx";
import { Spinner } from "@mroiban/golem";
import { Section } from "../ui";
export default function SpinnerSection() {
  return <Section id="spinner" title="Spinner" description="An arc in Onyx's foreground, turning every 700 ms. Plain Onyx appears when motion is reduced or unavailable.">
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      {(["xs", "sm", "md", "lg"] as const).map(size => <span key={size} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Spinner size={size} label={`Loading ${size}`} data-testid={`spinner-${size}`} />{size}</span>)}
    </div>
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>Plain Onyx (reference)
      {(["xs", "sm", "md", "lg"] as const).map(size => <OnyxSpinner key={size} size={size} label={`Plain ${size}`} data-testid={`plain-${size}`} />)}
    </div>
    </div>
  </Section>;
}
