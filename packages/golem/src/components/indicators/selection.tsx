// Shared only by the indicators group. Onyx owns selection; this measures its rendered items.
import * as React from "react";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../../anima";
import { useDomState } from "../shared";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  border: number;
  editor: boolean;
  alpha: number;
};
const attrs = [
  "aria-selected",
  "disabled",
  "data-disabled",
  "aria-disabled",
  "aria-checked",
  "data-state",
  "data-active",
  "data-variant",
  "class",
  "style",
];
export function SelectionMotion({
  target,
  scene,
  selector,
  onStatus,
}: {
  target: HTMLElement;
  scene: string;
  selector: string;
  onStatus: (s: AnimaStatus) => void;
}) {
  const ref = React.useRef<HTMLElement | null>(target);
  const anima = React.useRef<AnimaHandle>(null);
  const selected = useDomState(
    ref,
    attrs,
    (el) => {
      const item = el.querySelector<HTMLElement>(selector);
      return item
        ? Array.from(el.querySelectorAll("[data-slot]")).indexOf(item)
        : -1;
    },
    -1,
    true,
  );
  const [geometry, setGeometry] = React.useState<Record<
    string,
    number | boolean
  > | null>(null);
  const previous = React.useRef<Box | null>(null);
  const ready = React.useRef(false);
  const change = React.useRef(false);
  const handleStatus = React.useCallback(
    (s: AnimaStatus) => {
      ready.current = s === "ready";
      onStatus(s);
    },
    [onStatus],
  );

  React.useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const item = target.querySelector<HTMLElement>(selector);
      const list = target.getBoundingClientRect();
      if (!list.width || !list.height) return;
      const rect = item?.getBoundingClientRect();
      const css = item && getComputedStyle(item);
      const line = target.dataset.variant === "line";
      const editor = target.dataset.variant === "editor";
      const border = line
        ? parseFloat(css?.borderBottomWidth ?? "0")
        : editor
          ? parseFloat(css?.borderTopWidth ?? "0")
          : 0;
      const box: Box = {
        x: rect
          ? rect.left - list.left - target.clientLeft + target.scrollLeft
          : 0,
        y: rect
          ? rect.top -
            list.top -
            target.clientTop +
            target.scrollTop +
            (line ? rect.height - border : 0)
          : 0,
        width: rect?.width ?? 0,
        height: line ? border : (rect?.height ?? 0),
        radius: line ? 0 : parseFloat(css?.borderTopLeftRadius ?? "0") || 0,
        border,
        editor,
        alpha: Number(css?.opacity ?? 1),
      };
      const last = previous.current;
      if (
        last &&
        JSON.stringify(last) === JSON.stringify(box) &&
        geometry?.listWidth === target.clientWidth &&
        geometry?.listHeight === target.clientHeight
      )
        return;
      // Snapshot the actual drawing when interrupted, so a quick second selection continues
      // from the visible position rather than jumping to the previous destination.
      const painted = ready.current
        ? anima.current
            ?.icon()
            ?.shadowRoot?.querySelector("[data-indicator]")
            ?.getBoundingClientRect()
        : null;
      const fromX =
        painted && painted.width
          ? painted.left - list.left - target.clientLeft + target.scrollLeft
          : (last?.x ?? box.x);
      const fromY =
        painted && painted.height
          ? painted.top - list.top - target.clientTop + target.scrollTop
          : (last?.y ?? box.y);
      // SVG matrices serialize to five decimals. Quantize before taking the inverse,
      // and discard subpixel drift so a near-zero distance cannot magnify that rounding.
      const distance = (d: number) =>
        Math.abs(d) < 0.01 ? 0.001 : Math.round(d * 1000) / 1000;
      const dx = distance(box.x - fromX),
        dy = distance(box.y - fromY);
      change.current = !!last && ready.current;
      previous.current = box;
      setGeometry({
        listWidth: target.clientWidth || list.width,
        listHeight: target.clientHeight || list.height,
        startX: box.x,
        startY: box.y,
        dx,
        dy,
        width: box.width,
        height: box.height,
        radius: box.radius,
        border: box.border,
        editor: box.editor,
        vertical: Math.abs(dy) > Math.abs(dx),
        direction: (Math.abs(dy) > Math.abs(dx) ? dy : dx) < 0 ? -1 : 1,
        present: !!item,
        alpha: box.alpha,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    for (const el of target.querySelectorAll<HTMLElement>("[data-slot]"))
      observer.observe(el);
    const mutation = new MutationObserver(measure);
    mutation.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: attrs,
    });
    target.ownerDocument.fonts?.addEventListener("loadingdone", measure);
    void target.ownerDocument.fonts?.ready.then(measure);
    return () => {
      alive = false;
      observer.disconnect();
      mutation.disconnect();
      target.ownerDocument.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [target, selector, selected, geometry]);

  React.useEffect(() => {
    if (change.current) {
      anima.current?.fire("travel");
      change.current = false;
    }
    // Mark the rectangle for interruption measurements without relying on Anima's internal ids.
    const shape = anima.current?.icon()?.shadowRoot?.querySelector("rect");
    shape?.setAttribute("data-indicator", "");
  }, [geometry]);
  if (!geometry) return null;
  return (
    <AnimaControl
      ref={anima}
      scene={scene}
      className="golem-part__motion golem-selection__motion"
      inputs={geometry}
      onStatus={handleStatus}
    />
  );
}
