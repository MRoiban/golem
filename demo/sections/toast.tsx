import * as React from "react";
import * as Onyx from "@mroiban/onyx";
import { ToastProvider, ToastQueueViewport, useToast } from "@mroiban/golem";
import { Section } from "../ui";
const tones = ["neutral", "info", "success", "warning", "danger"] as const;
function ToastDemo() {
  const queue = useToast();
  const current = queue.toasts.at(-1);
  return <>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{tones.map(tone => <Onyx.Button key={tone} onClick={() => queue.toast({ title: `${tone} notification`, description: "Created by Onyx's queue.", tone, duration: 0 })}>Raise {tone}</Onyx.Button>)}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Onyx.Button onClick={() => current && queue.update(current.id, { tone: current.tone === "success" ? "info" : "success", title: "Updated notification" })}>Update latest</Onyx.Button>
      <Onyx.Button onClick={() => queue.toast({ title: "Timed notification", tone: "info", duration: 1200 })}>Raise timed</Onyx.Button>
      <Onyx.Button onClick={() => queue.dismiss()}>Dismiss all</Onyx.Button><Onyx.Button disabled>Unavailable action</Onyx.Button>
    </div>
    <div style={{ minHeight: 150, position: "relative" }}><ToastQueueViewport label="Demo notifications" style={{ position: "relative", inset: "auto", width: "100%", marginTop: 20 }} /></div>
    <p>Plain Onyx (reference)</p>
    <Onyx.ToastRoot tone="success" data-testid="plain" style={{ transform: "none" }}><Onyx.ToastIcon><Onyx.Icon name="pass"/></Onyx.ToastIcon><Onyx.ToastMessage>Original notification</Onyx.ToastMessage></Onyx.ToastRoot>
  </>;
}
export default function ToastSection() {
  return <Section id="toast" title="Toast" description="Decorative tone icons in Onyx's original toast slots. Queue timing and live regions stay with Onyx.">
    <ToastProvider viewport={false} maxVisible={5} initialToasts={[{ title: "Welcome notification", tone: "info", duration: 0 }]}><ToastDemo/></ToastProvider>
  </Section>;
}
