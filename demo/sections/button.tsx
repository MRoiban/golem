import * as React from "react";
import { Button as OnyxButton } from "@mroiban/onyx";
import { Button } from "@mroiban/golem";
import { Section } from "../ui";
function Save({ fail = false }: { fail?: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<"success" | "error">();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return <Button data-testid={fail ? "save-error" : "save"} loading={loading} result={result}
    onClick={() => { setResult(undefined); setLoading(true); timer.current = setTimeout(() => { setLoading(false); setResult(fail ? "error" : "success"); }, 700); }}>
    {fail ? "Save with error" : "Save"}
  </Button>;
}
export default function ButtonSection() {
  const [samplesLoading, setSamplesLoading] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [result, setResult] = React.useState<"success" | "error">();
  return <Section id="button" title="Button" description="Press squash, a foreground loading arc, and persistent success or error feedback. The accessible label stays in place.">
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {(["default", "destructive", "secondary", "outline", "ghost", "link"] as const).map(variant => <Button key={variant} variant={variant} loading={samplesLoading} onClick={() => setCount(c => c + 1)} data-testid={`variant-${variant}`}>{variant}</Button>)}
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "icon", "icon-sm", "icon-xs", "native"] as const).map(size => <Button key={size} size={size} loading={samplesLoading} aria-label={`Size ${size}`} data-testid={`size-${size}`} onClick={() => setCount(c => c + 1)}>{size.startsWith("icon") ? "+" : size}</Button>)}
    </div>
    <OnyxButton onClick={() => setSamplesLoading(v => !v)}>Toggle samples loading</OnyxButton>
    <p data-testid="click-count">Activations: {count}</p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Save /><Save fail /><Button disabled>Disabled</Button><Button loading data-testid="loading">Loading</Button><Button result="success" data-testid="initial-success">Completed</Button><Button result="error" data-testid="initial-error">Failed</Button></div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Button result={result} data-testid="result">Controlled result</Button>
      <OnyxButton onClick={() => setResult("success")}>Show success</OnyxButton>
      <OnyxButton onClick={() => setResult("error")}>Show error</OnyxButton>
      <OnyxButton onClick={() => setResult(undefined)}>Clear result</OnyxButton>
    </div>
    <Button asChild variant="link" data-testid="as-child"><a href="#button-link">Button link</a></Button>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><OnyxButton data-testid="plain">Plain Onyx</OnyxButton><OnyxButton loading>Plain loading</OnyxButton></div>
    </div>
  </Section>;
}
