import * as React from "react";
import { createPortal } from "react-dom";
import { Slider as OnyxSlider, type SliderProps as OnyxSliderProps } from "@mroiban/onyx";
import { AnimaControl, type AnimaHandle, type AnimaStatus } from "../../anima";
import { useDomState, useFireOnChange, useMergedRef } from "../shared";

export type SliderProps = OnyxSliderProps;

function ThumbMotion({ thumb, dragging }: { thumb: HTMLElement; dragging: boolean }) {
  const target = React.useRef(thumb);
  const value = useDomState(target, ["aria-valuenow"], (t) => t.getAttribute("aria-valuenow"), thumb.getAttribute("aria-valuenow"));
  const [status, setStatus] = React.useState<AnimaStatus>("off");
  const anima = React.useRef<AnimaHandle>(null);
  const keyboard = React.useRef(false);
  const [focused, setFocused] = React.useState(thumb === document.activeElement);
  React.useLayoutEffect(() => {
    const key = (e: KeyboardEvent) => {
      keyboard.current = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key);
    };
    const clear = () => { keyboard.current = false; };
    const focus = () => setFocused(true);
    const blur = () => { clear(); setFocused(false); };
    thumb.addEventListener("keydown", key);
    thumb.addEventListener("focus", focus);
    thumb.addEventListener("blur", blur);
    window.addEventListener("pointerdown", clear, true);
    return () => {
      thumb.removeEventListener("keydown", key);
      thumb.removeEventListener("focus", focus);
      thumb.removeEventListener("blur", blur);
      window.removeEventListener("pointerdown", clear, true);
    };
  }, [thumb]);
  // Only keyboard changes pop. A drag has no position animation: Radix moves this thumb's DOM.
  useFireOnChange(value, status === "ready", () => {
    if (keyboard.current && !dragging && thumb === document.activeElement) anima.current?.fire("pop");
    keyboard.current = false;
  });
  React.useLayoutEffect(() => {
    thumb.dataset.golemThumb = status;
    return () => { delete thumb.dataset.golemThumb; };
  }, [thumb, status]);
  return <span className="golem-slider__part" data-golem-part="slider" data-anima={status}>
    <AnimaControl ref={anima} scene="slider" className="golem-part__motion golem-slider__motion"
      inputs={{ down: dragging && focused }} onStatus={setStatus} />
  </span>;
}

/** Each drawing is a child of its Onyx thumb; Radix owns position, value, focus and input. */
export const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(function Slider(props, ref) {
  const root = React.useRef<HTMLSpanElement | null>(null);
  const setRefs = useMergedRef(root, ref);
  const [thumbs, setThumbs] = React.useState<HTMLElement[]>([]);
  const [dragging, setDragging] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const discover = () => {
      const next = Array.from(el.querySelectorAll<HTMLElement>("[data-slot='slider-thumb']"));
      setThumbs((prev) => prev.length === next.length && prev.every((t, i) => t === next[i]) ? prev : next);
    };
    discover();
    const mo = new MutationObserver(discover);
    mo.observe(el, { childList: true, subtree: true });
    // Capture the track press too. Radix focuses the thumb it selects during pointerdown.
    const press = (e: PointerEvent) => { if (e.button === 0 && !el.hasAttribute("data-disabled")) setDragging(true); };
    const release = () => setDragging(false);
    el.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      mo.disconnect();
      el.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, []);
  return <div className="golem-slider golem-part">
    <OnyxSlider ref={setRefs} {...props} />
    {thumbs.map((thumb, i) => createPortal(<ThumbMotion thumb={thumb} dragging={dragging} />, thumb, String(i)))}
  </div>;
});
