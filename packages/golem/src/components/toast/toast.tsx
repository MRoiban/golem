import * as React from "react";
import { createPortal } from "react-dom";
import { ToastProvider as OnyxProvider, ToastQueueViewport as OnyxViewport,
  type ToastProviderProps as OnyxProviderProps, type ToastQueueViewportProps as OnyxViewportProps } from "@mroiban/onyx";
import { useMergedRef } from "../shared";
import { ToneIcon, type Tone } from "../alert/tone-icon";

export { useToast, useToastQueue, ToastRoot, ToastViewport, ToastIcon, ToastContent, ToastMessage,
  ToastSource, ToastText, ToastClose, ToastActions, ToastProgress,
  type ToastOptions, type ToastEntry, type ToastQueue, type ToastQueueOptions } from "@mroiban/onyx";
export type ToastProviderProps = OnyxProviderProps;
export type ToastQueueViewportProps = OnyxViewportProps;

/** Onyx exposes no queue icon-renderer hook. Portals decorate its existing slots, without
 * copying its queue, announcer, timers, progress, gestures, focus restoration or event handlers. */
export const ToastQueueViewport = React.forwardRef<HTMLDivElement, ToastQueueViewportProps>(function ToastQueueViewport(props, ref) {
  const viewport = React.useRef<HTMLDivElement | null>(null);
  const refs = useMergedRef(viewport, ref);
  const [slots, setSlots] = React.useState<{ el: HTMLElement; id: string; tone: Tone }[]>([]);
  React.useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const read = () => {
      const next = Array.from(el.querySelectorAll<HTMLElement>("[data-slot='toast-icon'] > .codicon")).map(slot => {
        const toast = slot.closest("[data-toast-id]")!;
        return { el: slot, id: toast.getAttribute("data-toast-id")!, tone: (toast.getAttribute("data-tone") ?? "neutral") as Tone };
      });
      setSlots(prev => prev.length === next.length && prev.every((s, i) => s.el === next[i]!.el && s.tone === next[i]!.tone) ? prev : next);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-tone"] });
    return () => observer.disconnect();
  }, []);
  return <><OnyxViewport {...props} ref={refs} className={["golem-toast-viewport", props.className].filter(Boolean).join(" ")} />
    {slots.map(slot => createPortal(<ToneIcon scene="toast" tone={slot.tone} />, slot.el, slot.id))}</>;
});

export function ToastProvider({ children, viewport = true, inline = false, label = "Notifications", ...options }: ToastProviderProps) {
  return <OnyxProvider {...options} viewport={false}>
    {children}
    {viewport && <ToastQueueViewport inline={inline} label={label} />}
  </OnyxProvider>;
}
