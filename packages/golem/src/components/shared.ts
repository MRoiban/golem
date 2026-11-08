// Helpers every Golem component uses. The pattern (docs/components.md): the Onyx primitive stays in
// place and owns roles, focus, keyboard and state; Golem reads that state back from the DOM and
// draws it with an aria-hidden Anima part.
import * as React from "react";

/** One ref callback that sets a local ref and forwards to the caller's ref. */
export function useMergedRef<T>(local: React.MutableRefObject<T | null>, forwarded: React.ForwardedRef<T>) {
  return React.useCallback((node: T | null) => {
    local.current = node;
    if (typeof forwarded === "function") forwarded(node);
    else if (forwarded) forwarded.current = node;
  }, [forwarded]);
}

/**
 * Follows attributes of an element (or of elements matching `selector` inside it) and returns
 * `read(el)`, recomputed on every change. Source of truth is the DOM Onyx renders, so controlled,
 * uncontrolled, form reset and Field wiring all behave as in Onyx, whoever changes them.
 */
export function useDomState<E extends Element, T>(
  ref: React.RefObject<E | null>, attributes: string[], read: (el: E) => T, initial: T, subtree = false,
): T {
  const [value, setValue] = React.useState<T>(initial);
  const reader = React.useRef(read);
  reader.current = read;
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const next = reader.current(el);
      setValue((prev) => (Object.is(prev, next) || JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: attributes, subtree, childList: subtree });
    return () => mo.disconnect();
  }, [attributes.join(" "), subtree]);
  return value;
}

/** Pointer-down state for a press squash; ignores disabled controls and non-primary buttons. */
export function usePress(disabled?: boolean) {
  const [down, setDown] = React.useState(false);
  const release = () => setDown(false);
  return {
    down,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => { if (!disabled && e.button === 0) setDown(true); },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
    },
  };
}

/** Fires `trigger` on the Anima part when `value` changes after the part is ready (not on mount). */
export function useFireOnChange(value: unknown, ready: boolean, fire: () => void) {
  const last = React.useRef(value);
  React.useEffect(() => {
    if (!Object.is(last.current, value) && ready) fire();
    last.current = value;
  }, [value, ready]);
}
