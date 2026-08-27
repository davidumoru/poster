import {
  buildGrid,
  inkForRegion,
  paintGrid,
  type Rect,
} from "@/lib/poster/grid";
import {
  drawParagraph,
  drawTracked,
  fitSize,
  font,
  lineCount,
  rotated,
  trackedWidth,
} from "@/lib/poster/text";
import { drawFill, paperTexture } from "@/lib/poster/texture";
import type { RenderContext, Sheet } from "@/lib/poster/types";

export const POSTER_SHEET: Sheet = { width: 1000, height: 1414 };

const PAPER = "#f4f2ec";
const INK = "#141210";

const MARGIN = 76;
// Deliberately wider than MARGIN: the right rail holds the rotated colophon.
const RAIL = 150;
const LIVE_WIDTH = POSTER_SHEET.width - MARGIN - RAIL;

function paintField(context: RenderContext, rect: Rect, columns?: number) {
  const { ctx, spec, time } = context;
  const blocks = buildGrid({
    rect,
    colors: spec.palette.colors,
    seed: spec.seed,
    warp: spec.warp,
    phase: time * spec.drift,
    columns,
  });

  paintGrid(ctx, blocks);
  paperTexture(ctx, rect.x, rect.y, rect.width, rect.height, {
    seed: spec.seed,
    intensity: spec.grain,
  });

  if (context.source && spec.scan > 0.04) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.28, spec.scan * 0.3);
    ctx.globalCompositeOperation = "multiply";
    drawFill(ctx, context.source, rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  return blocks;
}

function drawColophon(context: RenderContext, bottom: number, right: number) {
  const { ctx, spec } = context;
  ctx.fillStyle = INK;
  ctx.font = font("sans", 500, 13);
  drawTracked(ctx, spec.copy.footer.toUpperCase(), MARGIN, bottom, 2.4);
  const mark = spec.copy.mark;
  drawTracked(ctx, mark, right - trackedWidth(ctx, mark, 2.4), bottom, 2.4);
}

function drawRail(context: RenderContext) {
  const { ctx, spec } = context;
  rotated(ctx, POSTER_SHEET.width - 58, MARGIN, Math.PI / 2, () => {
    ctx.fillStyle = INK;
    ctx.font = font("sans", 500, 12);
    drawTracked(
      ctx,
      `${spec.copy.footer.toUpperCase()}  ·  ${spec.copy.mark.toUpperCase()}`,
      0,
      0,
      2.6,
    );
  });
}

function headlineSize(context: RenderContext, width: number) {
  const { ctx, spec } = context;
  const half = width * 0.48;
  return Math.min(
    fitSize(ctx, spec.copy.title, half, "sans", 400, 52, 22),
    fitSize(ctx, spec.copy.subtitle, half, "sans", 400, 52, 22),
  );
}

function drawHeadlinePair(
  context: RenderContext,
  x: number,
  baseline: number,
  width: number,
  size: number,
  ink = INK,
) {
  const { ctx, spec } = context;
  ctx.fillStyle = ink;
  ctx.font = font("sans", 400, size);
  ctx.fillText(spec.copy.title, x, baseline);
  ctx.fillText(spec.copy.subtitle, x + width * 0.52, baseline);
}

const BODY_SIZE = 15.5;
const BODY_LEADING = 19.5;

function bodyPairLines(
  context: RenderContext,
  width: number,
  maxLines: number,
) {
  const { ctx, spec } = context;
  const columnWidth = (width - 62) / 2;
  ctx.font = font("serif", 400, BODY_SIZE);
  return Math.max(
    lineCount(ctx, spec.copy.body, columnWidth, maxLines),
    lineCount(ctx, spec.copy.bodyAlt, columnWidth, maxLines),
  );
}

function drawBodyPair(
  context: RenderContext,
  x: number,
  y: number,
  width: number,
  lines: number,
  ink = INK,
) {
  const { ctx, spec } = context;
  const gap = 62;
  const columnWidth = (width - gap) / 2;
  ctx.fillStyle = ink;
  ctx.font = font("serif", 400, BODY_SIZE);
  drawParagraph(ctx, spec.copy.body, {
    x,
    y,
    width: columnWidth,
    lineHeight: BODY_LEADING,
    maxLines: lines,
    align: "justify",
  });
  drawParagraph(ctx, spec.copy.bodyAlt, {
    x: x + columnWidth + gap,
    y,
    width: columnWidth,
    lineHeight: BODY_LEADING,
    maxLines: lines,
    align: "justify",
  });
}

function drawStack(context: RenderContext) {
  // The essay is measured first; the grid then takes every line the copy
  // leaves, so the sheet fills whether the text runs short or long.
  const colophon = POSTER_SHEET.height - MARGIN;
  const lines = bodyPairLines(context, LIVE_WIDTH, 14);
  const size = headlineSize(context, LIVE_WIDTH);

  const bodyTop = colophon - 60 - (lines - 1) * BODY_LEADING;
  const headlineBaseline = bodyTop - 46;
  const gridHeight = Math.max(
    420,
    headlineBaseline - size * 0.82 - 54 - MARGIN,
  );

  paintField(context, {
    x: MARGIN,
    y: MARGIN,
    width: LIVE_WIDTH,
    height: gridHeight,
  });
  drawHeadlinePair(context, MARGIN, headlineBaseline, LIVE_WIDTH, size);
  drawBodyPair(context, MARGIN, bodyTop, LIVE_WIDTH, lines);
  drawColophon(context, colophon, MARGIN + LIVE_WIDTH);
  drawRail(context);
}

function drawOverlay(context: RenderContext) {
  const { ctx, spec } = context;
  const rect = { x: MARGIN, y: MARGIN, width: LIVE_WIDTH, height: 1180 };
  const blocks = paintField(context, rect);

  const titleX = MARGIN + 38;
  const titleY = MARGIN + 140;
  const titleSize = fitSize(
    ctx,
    spec.copy.title,
    LIVE_WIDTH * 0.62,
    "sans",
    400,
    56,
    24,
  );
  const titleWidth = ctx.measureText(spec.copy.title).width;
  ctx.fillStyle = inkForRegion(
    blocks,
    titleX,
    titleY - titleSize * 0.76,
    titleWidth,
    titleSize,
  );
  ctx.fillText(spec.copy.title, titleX, titleY);

  const columnWidth = 250;
  const bodyY = titleY + 70;
  ctx.font = font("serif", 400, 14.5);
  ctx.fillStyle = inkForRegion(blocks, titleX, bodyY - 12, columnWidth, 200);
  drawParagraph(ctx, spec.copy.body, {
    x: titleX,
    y: bodyY,
    width: columnWidth,
    lineHeight: 18,
    maxLines: 11,
    align: "justify",
  });

  const subtitleX = MARGIN + LIVE_WIDTH * 0.36;
  const subtitleY = MARGIN + 800;
  ctx.font = font("sans", 400, titleSize);
  const subtitleWidth = ctx.measureText(spec.copy.subtitle).width;
  ctx.fillStyle = inkForRegion(
    blocks,
    subtitleX,
    subtitleY - titleSize * 0.76,
    subtitleWidth,
    titleSize,
  );
  ctx.fillText(spec.copy.subtitle, subtitleX, subtitleY);

  const altY = subtitleY + 70;
  ctx.font = font("serif", 400, 14.5);
  ctx.fillStyle = inkForRegion(blocks, subtitleX, altY - 12, columnWidth, 200);
  drawParagraph(ctx, spec.copy.bodyAlt, {
    x: subtitleX,
    y: altY,
    width: columnWidth,
    lineHeight: 18,
    maxLines: 11,
    align: "justify",
  });

  const footerY = rect.y + rect.height - 26;
  ctx.font = font("sans", 500, 13);
  ctx.fillStyle = inkForRegion(blocks, titleX, footerY - 12, 420, 16);
  drawTracked(ctx, spec.copy.footer.toUpperCase(), titleX, footerY, 2.4);
  drawColophon(context, POSTER_SHEET.height - MARGIN, MARGIN + LIVE_WIDTH);
}

function drawSidebar(context: RenderContext) {
  const { ctx, spec } = context;
  const gridWidth = 520;
  paintField(
    context,
    { x: MARGIN, y: MARGIN, width: gridWidth, height: 1180 },
    3,
  );

  const columnX = MARGIN + gridWidth + 64;
  const columnWidth = POSTER_SHEET.width - MARGIN - columnX;

  ctx.fillStyle = INK;
  fitSize(ctx, spec.copy.title, columnWidth, "sans", 400, 42, 20);
  ctx.fillText(spec.copy.title, columnX, MARGIN + 72);
  fitSize(ctx, spec.copy.subtitle, columnWidth, "sans", 400, 42, 20);
  ctx.fillText(spec.copy.subtitle, columnX, MARGIN + 268);

  ctx.font = font("serif", 400, 14.5);
  const afterBody = drawParagraph(ctx, spec.copy.body, {
    x: columnX,
    y: MARGIN + 430,
    width: columnWidth,
    lineHeight: 18,
    maxLines: 16,
    align: "justify",
  });
  drawParagraph(ctx, spec.copy.bodyAlt, {
    x: columnX,
    y: afterBody + 54,
    width: columnWidth,
    lineHeight: 18,
    maxLines: 16,
    align: "justify",
  });

  drawColophon(
    context,
    POSTER_SHEET.height - MARGIN,
    POSTER_SHEET.width - MARGIN,
  );
}

function drawBanner(context: RenderContext) {
  const { ctx, spec } = context;

  ctx.fillStyle = INK;
  const titleSize = fitSize(
    ctx,
    spec.copy.title,
    LIVE_WIDTH,
    "sans",
    400,
    96,
    32,
  );
  ctx.fillText(spec.copy.title, MARGIN, MARGIN + titleSize * 0.78);

  ctx.font = font("sans", 400, 26);
  const subtitleWidth = ctx.measureText(spec.copy.subtitle).width;
  ctx.fillText(
    spec.copy.subtitle,
    MARGIN + LIVE_WIDTH - subtitleWidth,
    MARGIN + titleSize * 0.78 + 44,
  );

  const gridTop = MARGIN + titleSize * 0.78 + 84;
  const colophon = POSTER_SHEET.height - MARGIN;
  const lines = bodyPairLines(context, LIVE_WIDTH, 12);
  const bodyTop = colophon - 60 - (lines - 1) * BODY_LEADING;

  paintField(context, {
    x: MARGIN,
    y: gridTop,
    width: LIVE_WIDTH,
    height: Math.max(420, bodyTop - 52 - gridTop),
  });

  drawBodyPair(context, MARGIN, bodyTop, LIVE_WIDTH, lines);
  drawColophon(context, colophon, MARGIN + LIVE_WIDTH);
  drawRail(context);
}

function drawDiptych(context: RenderContext) {
  const { ctx, spec, time } = context;

  ctx.fillStyle = "#131210";
  ctx.fillRect(0, 0, POSTER_SHEET.width, POSTER_SHEET.height);

  const sheets = [
    { x: 96, y: 232, width: 348, height: 800, offset: 0 },
    { x: 508, y: 132, width: 412, height: 960, offset: 1.4 },
  ];

  sheets.forEach((mini, index) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(mini.x, mini.y, mini.width, mini.height);

    const pad = 22;
    const gridHeight = mini.height * 0.8;
    const blocks = buildGrid({
      rect: {
        x: mini.x + pad,
        y: mini.y + pad,
        width: mini.width - pad * 2,
        height: gridHeight,
      },
      colors: spec.palette.colors,
      seed: spec.seed + index * 977,
      warp: spec.warp,
      phase: time * spec.drift + mini.offset,
      columns: index === 0 ? 3 : 4,
    });
    paintGrid(ctx, blocks);
    paperTexture(ctx, mini.x, mini.y, mini.width, mini.height, {
      seed: spec.seed + index,
      intensity: spec.grain,
      creases: false,
    });

    const textY = mini.y + pad + gridHeight + 34;
    const innerWidth = mini.width - pad * 2;
    const heading = index === 0 ? spec.copy.title : spec.copy.subtitle;
    ctx.fillStyle = INK;
    fitSize(ctx, heading, innerWidth * 0.9, "sans", 400, 21, 12);
    ctx.fillText(heading, mini.x + pad, textY);

    ctx.font = font("serif", 400, 9);
    drawParagraph(ctx, index === 0 ? spec.copy.body : spec.copy.bodyAlt, {
      x: mini.x + pad,
      y: textY + 26,
      width: innerWidth,
      lineHeight: 11.5,
      maxLines: 9,
      align: "justify",
    });
  });

  ctx.fillStyle = "#f4f2ec";
  ctx.font = font("sans", 400, 26);
  ctx.fillText(`${spec.copy.title} / ${spec.copy.subtitle}`, 96, 1216);
  ctx.font = font("sans", 500, 13);
  drawTracked(ctx, spec.copy.footer.toUpperCase(), 96, 1260, 2.4);
  ctx.fillStyle = "#8b857a";
  drawTracked(ctx, spec.copy.mark.toUpperCase(), 96, 1292, 2.4);
}

export function drawPosterSheet(context: RenderContext) {
  const { ctx, spec } = context;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, POSTER_SHEET.width, POSTER_SHEET.height);
  ctx.textBaseline = "alphabetic";

  switch (spec.posterVariant) {
    case "overlay":
      drawOverlay(context);
      break;
    case "sidebar":
      drawSidebar(context);
      break;
    case "banner":
      drawBanner(context);
      break;
    case "diptych":
      drawDiptych(context);
      break;
    default:
      drawStack(context);
  }

  if (spec.posterVariant !== "diptych") {
    // A light tooth over everything, so paper and ink share one surface.
    paperTexture(ctx, 0, 0, POSTER_SHEET.width, POSTER_SHEET.height, {
      seed: spec.seed + 101,
      intensity: spec.grain * 0.28,
      creases: false,
    });
  }
}
