import * as React from "react";
import { createPortal } from "react-dom";
import { AnimaControl, type AnimaStatus } from "../../anima";
import { useDomState } from "../shared";

/** Paint inside Onyx's existing icon box: no extra flex item and no changed trigger semantics. */
export function useChevron(ref: React.RefObject<HTMLButtonElement | null>, scene: "collapsible" | "accordion", asChild?: boolean) {
  const open = useDomState(ref, ["aria-expanded", "data-state"], b => b.getAttribute("aria-expanded") === "true", false);
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  React.useLayoutEffect(() => {
    setSlot(asChild ? null : ref.current?.querySelector<HTMLElement>(`[data-slot='${scene}-chevron']`) ?? null);
  }, [asChild]);
  return {
    attributes: slot ? { "data-golem-part": scene, "data-anima": status } : {},
    drawing: slot && createPortal(<AnimaControl scene={scene} inputs={{ open }} onStatus={setStatus}
      className="golem-part__motion golem-chevron__motion" />, slot),
  };
}
