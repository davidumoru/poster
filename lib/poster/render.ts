import { COVER_SHEET, drawCoverSheet } from "@/lib/poster/layouts/cover";
import { POSTER_SHEET, drawPosterSheet } from "@/lib/poster/layouts/poster";
import type { PosterSpec, Sheet } from "@/lib/poster/types";

export type RenderOptions = {
  source?: HTMLImageElement | null;
  /** Seconds. */
  time?: number;
  /** Device pixels per sheet unit. */
  scale?: number;
  resolution?: number;
};

export function sheetFor(spec: PosterSpec): Sheet {
  return spec.family === "poster" ? POSTER_SHEET : COVER_SHEET;
}

export function renderSheet(
  canvas: HTMLCanvasElement,
  spec: PosterSpec,
  { source = null, time = 0, scale = 1, resolution = 384 }: RenderOptions = {},
) {
  const sheet = sheetFor(spec);
  const width = Math.round(sheet.width * scale);
  const height = Math.round(sheet.height * scale);

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, sheet.width, sheet.height);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.imageSmoothingEnabled = true;

  const context = { ctx, spec, sheet, source, time, resolution };

  if (spec.family === "poster") {
    drawPosterSheet(context);
  } else {
    drawCoverSheet(context);
  }
}

export function exportSheet(
  spec: PosterSpec,
  { source = null, time = 0, scale = 2, resolution = 768 }: RenderOptions = {},
) {
  const canvas = document.createElement("canvas");
  renderSheet(canvas, spec, { source, time, scale, resolution });

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

export function fileNameFor(spec: PosterSpec) {
  const variant =
    spec.family === "poster" ? spec.posterVariant : spec.coverVariant;
  const field = spec.family === "cover" ? `-${spec.fieldVariant}` : "";
  return `${spec.family}-${variant}${field}-${spec.seed}.png`;
}
