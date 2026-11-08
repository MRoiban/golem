import * as React from "react";
import { createPortal } from "react-dom";
import {
  SectionSelect as OnyxSectionSelect,
  type SectionSelectProps as OnyxSectionSelectProps,
} from "@mroiban/onyx";
import { type AnimaStatus } from "../../anima";
import { useDomState } from "../shared";
import { SelectionMotion } from "../indicators/selection";
export type SectionSelectProps<TValue extends string> =
  OnyxSectionSelectProps<TValue>;
/** Onyx's SectionSelect has no forwarded ref. Its popup paints the active (focused) option;
 * aria-selected remains the committed value/checkmark. Follow data-active for exact parity. */
export function SectionSelect<TValue extends string>(
  props: SectionSelectProps<TValue>,
) {
  const root = React.useRef<HTMLSpanElement>(null);
  const state = useDomState(
    root,
    ["aria-expanded", "aria-controls"],
    (el) => {
      const trigger = el.querySelector('[role="combobox"]');
      return {
        open: trigger?.getAttribute("aria-expanded") === "true",
        id: trigger?.getAttribute("aria-controls"),
      };
    },
    { open: false, id: null as string | null | undefined },
    true,
  );
  const [menu, setMenu] = React.useState<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    if (!state.open || !state.id) {
      setMenu(null);
      return;
    }
    const doc = root.current!.ownerDocument;
    const find = () =>
      setMenu(
        doc.getElementById(state.id!)?.firstElementChild as HTMLElement | null,
      );
    find();
    const observer = new MutationObserver(find);
    observer.observe(doc.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [state.open, state.id]);
  return (
    <span ref={root} className="golem-section-select">
      <OnyxSectionSelect {...props} />
      {menu && createPortal(<PopupMotion target={menu} />, menu)}
    </span>
  );
}
function PopupMotion({ target }: { target: HTMLElement }) {
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  React.useLayoutEffect(() => {
    target.classList.add("golem-section-select-menu");
    return () => {
      target.classList.remove("golem-section-select-menu");
      delete target.dataset.anima;
    };
  }, [target]);
  React.useLayoutEffect(() => {
    target.dataset.anima = status;
  }, [target, status]);
  return (
    <span data-golem-part="section-select" data-anima={status}>
      <SelectionMotion
        target={target}
        scene="section-select"
        selector='[data-slot="section-select-item"][data-active="true"]'
        onStatus={setStatus}
      />
    </span>
  );
}
