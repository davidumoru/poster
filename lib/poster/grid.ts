import { hexToRgb, luminance } from "@/lib/poster/color";
import { createRng } from "@/lib/poster/rng";

export type Rect = { x: number; y: number; width: number; height: number };

export type Block = Rect & { color: string; column: number; row: number };

// Hand-tuned rather than random: one dominant field, one supporting field and a
// few narrow strips is what makes a composition read as designed.
const COLUMN_RHYTHMS = [
  [0.4, 0.33, 0.11, 0.09, 0.07],
  [0.46, 0.35, 0.19],
  [0.13, 0.09, 0.46, 0.2, 0.12],
  [0.29, 0.28, 0.29, 0.14],
  [0.55, 0.13, 0.2, 0.12],
  [0.18, 0.44, 0.1, 0.28],
  [0.24, 0.4, 0.28, 0.08],
];

const ROW_RHYTHMS = [
  [1],
  [0.34, 0.66],
  [0.62, 0.38],
  [0.22, 0.46, 0.32],
  [0.15, 0.35, 0.3, 0.2],
  [0.5, 0.5],
  [0.12, 0.55, 0.33],
];

function normalise(weights: number[]) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((value) => value / total);
}

function jitter(weights: number[], rng: () => number, amount: number) {
  return normalise(
    weights.map((value) => value * (1 + (rng() - 0.5) * amount)),
  );
}

// Renormalised, so nudging a shared edge never opens a gap between blocks.
function animate(
  weights: number[],
  phase: number,
  warp: number,
  offset: number,
) {
  if (warp <= 0.001) return weights;
  // Capped below 1 so a block can never be modulated down to nothing.
  const swing = Math.min(0.85, warp * 0.35);
  return normalise(
    weights.map(
      (value, index) =>
        value * (1 + Math.sin(phase + offset + index * 2.1) * swing),
    ),
  );
}

export type GridOptions = {
  rect: Rect;
  colors: string[];
  seed: number;
  warp: number;
  phase: number;
  columns?: number;
};

export function buildGrid({
  rect,
  colors,
  seed,
  warp,
  phase,
  columns,
}: GridOptions): Block[] {
  const rng = createRng(seed);
  const palette = rng.shuffle(colors.length ? colors : ["#111111"]);

  let columnWeights = jitter(rng.pick(COLUMN_RHYTHMS), rng.next, 0.34);
  if (columns && columns !== columnWeights.length) {
    const match = COLUMN_RHYTHMS.find((rhythm) => rhythm.length === columns);
    columnWeights = jitter(
      match ?? new Array(columns).fill(1 / columns),
      rng.next,
      0.34,
    );
  }
  columnWeights = animate(columnWeights, phase * 0.7, warp, 0);

  const blocks: Block[] = [];
  const above: string[] = [];
  let cursorX = rect.x;
  let ink = rng.int(0, palette.length);

  columnWeights.forEach((columnWeight, column) => {
    const columnWidth = columnWeight * rect.width;
    const rowWeights = animate(
      jitter(rng.pick(ROW_RHYTHMS), rng.next, 0.3),
      phase,
      warp,
      column * 1.3,
    );

    let cursorY = rect.y;
    rowWeights.forEach((rowWeight, row) => {
      const rowHeight = rowWeight * rect.height;
      const left = blocks.length ? blocks[blocks.length - 1].color : null;

      let color = palette[ink % palette.length];
      for (let attempt = 0; attempt < palette.length; attempt++) {
        color = palette[(ink + attempt) % palette.length];
        if (color !== above[column] && (row > 0 || color !== left)) {
          ink += attempt + 1;
          break;
        }
      }

      // Overdrawn by a hair so anti-aliasing never leaves seams between blocks.
      blocks.push({
        x: cursorX,
        y: cursorY,
        width: columnWidth + 0.6,
        height: rowHeight + 0.6,
        color,
        column,
        row,
      });
      above[column] = color;
      cursorY += rowHeight;
    });

    cursorX += columnWidth;
  });

  return blocks;
}

export function paintGrid(ctx: CanvasRenderingContext2D, blocks: Block[]) {
  for (const block of blocks) {
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);
  }
}

export function colorAt(blocks: Block[], x: number, y: number) {
  for (const block of blocks) {
    if (
      x >= block.x &&
      x < block.x + block.width &&
      y >= block.y &&
      y < block.y + block.height
    ) {
      return block.color;
    }
  }
  return null;
}

// Samples the whole area, not one point, so a headline straddling a light and a
// dark block still gets legible ink.
export function inkForRegion(
  blocks: Block[],
  x: number,
  y: number,
  width: number,
  height: number,
  light = "#faf8f3",
  dark = "#141210",
) {
  let total = 0;
  let samples = 0;

  for (let column = 0; column <= 6; column++) {
    for (let row = 0; row <= 2; row++) {
      const color = colorAt(
        blocks,
        x + (width * column) / 6,
        y + (height * row) / 2,
      );
      if (!color) continue;
      total += luminance(hexToRgb(color));
      samples += 1;
    }
  }

  if (!samples) return dark;
  return total / samples > 145 ? dark : light;
}
