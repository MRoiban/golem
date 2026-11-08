// CSS colour strings → [r, g, b, a] (0-255), for writing Anima Theme model colours.

/** Parses #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() and rgba() (comma or space syntax). */
export function parseColor(input: string): number[] | null {
  const s = input.trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1]!;
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = [0, 2, 4, 6].map((i) => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255));
    return n;
  }
  m = /^rgba?\(([^)]*)\)$/.exec(s);
  if (m) {
    const parts = m[1]!.split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = parts.slice(0, 3).map((p) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p)));
    const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    if ([...ch, a].some((v) => !Number.isFinite(v))) return null;
    return [...ch.map((v) => Math.round(Math.min(255, Math.max(0, v)))), Math.round(Math.min(1, Math.max(0, a)) * 255)];
  }
  return null;
}

let ctx: CanvasRenderingContext2D | null | undefined;
/** Any CSS colour (named, hsl, color-mix …) via the browser's canvas normalisation. */
export function cssColorToRgba(value: string): number[] | null {
  const direct = parseColor(value);
  if (direct || typeof document === "undefined") return direct;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = value;
  return parseColor(String(ctx.fillStyle));
}
