/**
 * Canvas typography. Canvas cannot resolve `var(--font-sans)` inside
 * `ctx.font`, so the real family names are read off probe elements once and
 * cached — otherwise every sheet silently falls back to the system default.
 */

export type FontRole = "sans" | "serif" | "mono";

const FALLBACKS: Record<FontRole, string> = {
  sans: "Helvetica Neue, Helvetica, Arial, sans-serif",
  serif: "Times New Roman, Times, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

let stacks: Record<FontRole, string> | null = null;

export function fontStacks(): Record<FontRole, string> {
  if (stacks) return stacks;
  if (typeof document === "undefined") return FALLBACKS;

  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;visibility:hidden";
  document.body.appendChild(probe);

  const read = (role: FontRole) => {
    probe.style.fontFamily = `var(--font-${role})`;
    const resolved = getComputedStyle(probe).fontFamily;
    return resolved && resolved !== "var(--font-" + role + ")"
      ? resolved
      : FALLBACKS[role];
  };

  stacks = { sans: read("sans"), serif: read("serif"), mono: read("mono") };
  probe.remove();
  return stacks;
}

/** Invalidate the cache after webfonts swap in. */
export function resetFontStacks() {
  stacks = null;
}

export function font(role: FontRole, weight: number | string, size: number) {
  return `${weight} ${size}px ${fontStacks()[role]}`;
}

export function measure(ctx: CanvasRenderingContext2D, text: string) {
  return ctx.measureText(text).width;
}

/** Greedy line breaking against `maxWidth`, capped at `maxLines`. */
export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 40,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      if (lines.length >= maxLines) return lines;
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

/** Number of lines `text` will occupy in a column of `width`. */
export function lineCount(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  maxLines = 40,
) {
  return wrapLines(ctx, text, width, maxLines).length;
}

export type ParagraphOptions = {
  x: number;
  y: number;
  width: number;
  lineHeight: number;
  maxLines?: number;
  align?: "left" | "right" | "justify";
};

/**
 * Draws a text column. `justify` spreads the word gaps to flush both edges —
 * the last line always stays ragged, the way a typesetter would leave it.
 *
 * Returns the y baseline just past the final line.
 */
export function drawParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  { x, y, width, lineHeight, maxLines = 40, align = "left" }: ParagraphOptions,
) {
  const lines = wrapLines(ctx, text, width, maxLines);
  const previousAlign = ctx.textAlign;
  ctx.textAlign = "left";

  lines.forEach((line, index) => {
    const baseline = y + index * lineHeight;
    const isLast = index === lines.length - 1;

    if (align === "right") {
      ctx.fillText(line, x + width - ctx.measureText(line).width, baseline);
      return;
    }

    if (align !== "justify" || isLast) {
      ctx.fillText(line, x, baseline);
      return;
    }

    const words = line.split(" ");
    if (words.length < 2) {
      ctx.fillText(line, x, baseline);
      return;
    }

    const inkWidth = words.reduce(
      (total, word) => total + ctx.measureText(word).width,
      0,
    );
    const gap = (width - inkWidth) / (words.length - 1);
    let cursor = x;
    for (const word of words) {
      ctx.fillText(word, cursor, baseline);
      cursor += ctx.measureText(word).width + gap;
    }
  });

  ctx.textAlign = previousAlign;
  return y + lines.length * lineHeight;
}

const supportsLetterSpacing =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "letterSpacing" in CanvasRenderingContext2D.prototype;

/** Micro-caps set with open tracking, as used on colophon and address lines. */
export function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  if (supportsLetterSpacing) {
    ctx.letterSpacing = `${tracking}px`;
    ctx.fillText(text, x, y);
    ctx.letterSpacing = "0px";
    return;
  }

  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  }
}

export function trackedWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking: number,
) {
  return ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
}

/** Largest size in [min, max] at which `text` still fits `maxWidth`. */
export function fitSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  role: FontRole,
  weight: number | string,
  max: number,
  min = 12,
) {
  let size = max;
  while (size > min) {
    ctx.font = font(role, weight, size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  ctx.font = font(role, weight, size);
  return size;
}

/** Runs `draw` inside a rotated frame anchored at (x, y). */
export function rotated(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  draw: () => void,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  draw();
  ctx.restore();
}
