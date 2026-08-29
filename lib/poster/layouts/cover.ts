import { buildRamp } from "@/lib/poster/color";
import { renderField, sampleLuminance } from "@/lib/poster/field";
import { drawFill, paperTexture } from "@/lib/poster/texture";
import {
  drawParagraph,
  drawTracked,
  fitSize,
  font,
  rotated,
} from "@/lib/poster/text";
import type { RenderContext, Sheet } from "@/lib/poster/types";

export const COVER_SHEET: Sheet = { width: 1000, height: 1280 };

const PAPER = "#ffffff";
const INK = "#111111";
const MUTED = "#b4b4b4";
const CARD = "#f4f2ec";

const MARGIN = 48;

function thumbnail(context: RenderContext, x: number, y: number, size: number) {
  const { ctx, spec, source } = context;

  if (source) {
    drawFill(ctx, source, x, y, size, size);
    return;
  }

  const ramp = buildRamp(spec.palette.colors, Math.max(4, spec.bands));
  const band = size / ramp.length;
  ramp.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y + index * band, size, band + 1);
  });
}

function drawSpecimen(context: RenderContext) {
  const { ctx, spec, sheet, time } = context;
  const art = sheet.width;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  const field = renderField(spec, { resolution: context.resolution, time });
  ctx.imageSmoothingEnabled = false;
  drawFill(ctx, field, 0, 0, art, art);
  ctx.imageSmoothingEnabled = true;
  paperTexture(ctx, 0, 0, art, art, {
    seed: spec.seed,
    intensity: spec.grain,
  });

  const top = art + MARGIN;
  const thumbSize = 172;
  thumbnail(context, MARGIN, top, thumbSize);

  const textX = MARGIN + thumbSize + 78;
  let baseline = top + 21;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = font("sans", 600, 25);
  ctx.fillText(spec.copy.title, textX, baseline);

  ctx.fillStyle = MUTED;
  ctx.font = font("sans", 400, 25);
  baseline = drawParagraph(ctx, spec.copy.kicker, {
    x: textX,
    y: baseline + 32,
    width: 300,
    lineHeight: 32,
    maxLines: 2,
  });
  ctx.fillText(spec.copy.meta, textX, baseline);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = font("sans", 400, 16.5);
  drawParagraph(ctx, spec.copy.body, {
    x: 596,
    y: top + 21,
    width: sheet.width - MARGIN - 596,
    lineHeight: 20.5,
    maxLines: 8,
  });
}

function drawBleed(context: RenderContext) {
  const { ctx, spec, sheet, time } = context;

  const field = renderField(spec, { resolution: context.resolution, time });
  ctx.imageSmoothingEnabled = false;
  drawFill(ctx, field, 0, 0, sheet.width, sheet.height);
  ctx.imageSmoothingEnabled = true;
  paperTexture(ctx, 0, 0, sheet.width, sheet.height, {
    seed: spec.seed,
    intensity: spec.grain,
  });

  const chipWidth = 604;
  const chipHeight = 306;
  const chipX = 72;
  const chipY = sheet.height - 72 - chipHeight;

  ctx.fillStyle = PAPER;
  ctx.fillRect(chipX, chipY, chipWidth, chipHeight);
  paperTexture(ctx, chipX, chipY, chipWidth, chipHeight, {
    seed: spec.seed + 5,
    intensity: spec.grain * 0.45,
    creases: false,
  });

  const padding = 40;
  const innerX = chipX + padding;
  const innerWidth = chipWidth - padding * 2;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  const titleSize = fitSize(
    ctx,
    spec.copy.title,
    innerWidth,
    "sans",
    600,
    38,
    20,
  );
  ctx.fillText(spec.copy.title, innerX, chipY + padding + titleSize * 0.82);

  const afterTitle = chipY + padding + titleSize * 0.82 + 30;
  ctx.fillStyle = MUTED;
  ctx.font = font("sans", 400, 21);
  ctx.fillText(`${spec.copy.kicker} · ${spec.copy.meta}`, innerX, afterTitle);

  ctx.fillStyle = "#1a1a1a";
  ctx.font = font("sans", 400, 15.5);
  drawParagraph(ctx, spec.copy.body, {
    x: innerX,
    y: afterTitle + 38,
    width: innerWidth,
    lineHeight: 19.5,
    maxLines: 6,
  });

  // The running head sits straight on the field, so take its ink from there.
  ctx.fillStyle =
    sampleLuminance(field, 0, 0, 0.62, 0.12) > 150
      ? "rgba(20,18,16,0.9)"
      : "rgba(255,255,255,0.94)";
  ctx.font = font("sans", 500, 15);
  drawTracked(ctx, spec.copy.footer.toUpperCase(), 72, 108, 2.6);
}

function drawIndex(context: RenderContext) {
  const { ctx, spec, sheet, time } = context;

  ctx.fillStyle = CARD;
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  const margin = 72;
  const inner = sheet.width - margin * 2;

  ctx.fillStyle = INK;
  ctx.font = font("sans", 500, 14);
  drawTracked(
    ctx,
    `SPECIMEN / ${spec.fieldVariant.toUpperCase()}`,
    margin,
    92,
    3,
  );
  ctx.fillRect(margin, 108, inner, 2);

  const artY = 140;
  const field = renderField(spec, { resolution: context.resolution, time });
  ctx.imageSmoothingEnabled = false;
  drawFill(ctx, field, margin, artY, inner, inner);
  ctx.imageSmoothingEnabled = true;
  paperTexture(ctx, margin, artY, inner, inner, {
    seed: spec.seed,
    intensity: spec.grain,
  });

  const ramp = buildRamp(spec.palette.colors, spec.bands);
  const swatchY = artY + inner + 28;
  const swatchWidth = inner / ramp.length;
  ramp.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(margin + index * swatchWidth, swatchY, swatchWidth + 0.5, 26);
  });

  const rows: [string, string][] = [
    ["FIELD", spec.fieldVariant],
    ["SEED", String(spec.seed)],
    ["BANDS", String(spec.bands)],
    ["SOURCE", spec.palette.name],
  ];

  let rowY = swatchY + 62;
  for (const [label, value] of rows) {
    ctx.fillStyle = "#8a867c";
    ctx.font = font("mono", 500, 13);
    drawTracked(ctx, label, margin, rowY, 2);
    ctx.fillStyle = INK;
    ctx.font = font("mono", 500, 15);
    ctx.fillText(value, margin + 108, rowY);
    rowY += 26;
  }

  ctx.fillStyle = "#3a3730";
  ctx.font = font("sans", 400, 15);
  drawParagraph(ctx, spec.copy.body, {
    x: margin + 336,
    y: swatchY + 62,
    width: inner - 336,
    lineHeight: 19,
    maxLines: 6,
  });

  rotated(ctx, sheet.width - 40, margin, Math.PI / 2, () => {
    ctx.fillStyle = "#8a867c";
    ctx.font = font("mono", 500, 12);
    drawTracked(ctx, spec.copy.mark.toUpperCase(), 0, 0, 2.4);
  });
}

export function drawCoverSheet(context: RenderContext) {
  switch (context.spec.coverVariant) {
    case "bleed":
      drawBleed(context);
      return;
    case "index":
      drawIndex(context);
      return;
    default:
      drawSpecimen(context);
  }
}
