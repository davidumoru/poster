import {
  buildGrid,
  paintGrid,
  paintOverBlocks,
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
  ink: string | null = INK,
) {
  const { ctx, spec } = context;
  const gap = 62;
  const columnWidth = (width - gap) / 2;
  if (ink) ctx.fillStyle = ink;
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
  const over = (bounds: Rect, draw: () => void) =>
    paintOverBlocks(ctx, blocks, rect, bounds, INK, draw);

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
  over(
    {
      x: titleX,
      y: titleY - titleSize * 0.8,
      width: titleWidth,
      height: titleSize,
    },
    () => ctx.fillText(spec.copy.title, titleX, titleY),
  );

  const columnWidth = 250;
  const bodyY = titleY + 70;
  const bodyLines = 11;
  ctx.font = font("serif", 400, 14.5);
  over(
    { x: titleX, y: bodyY - 14, width: columnWidth, height: bodyLines * 18 },
    () =>
      drawParagraph(ctx, spec.copy.body, {
        x: titleX,
        y: bodyY,
        width: columnWidth,
        lineHeight: 18,
        maxLines: bodyLines,
        align: "justify",
      }),
  );

  const subtitleX = MARGIN + LIVE_WIDTH * 0.36;
  const subtitleY = MARGIN + 800;
  ctx.font = font("sans", 400, titleSize);
  const subtitleWidth = ctx.measureText(spec.copy.subtitle).width;
  over(
    {
      x: subtitleX,
      y: subtitleY - titleSize * 0.8,
      width: subtitleWidth,
      height: titleSize,
    },
    () => {
      ctx.font = font("sans", 400, titleSize);
      ctx.fillText(spec.copy.subtitle, subtitleX, subtitleY);
    },
  );

  const altY = subtitleY + 70;
  ctx.font = font("serif", 400, 14.5);
  over(
    { x: subtitleX, y: altY - 14, width: columnWidth, height: bodyLines * 18 },
    () => {
      ctx.font = font("serif", 400, 14.5);
      drawParagraph(ctx, spec.copy.bodyAlt, {
        x: subtitleX,
        y: altY,
        width: columnWidth,
        lineHeight: 18,
        maxLines: bodyLines,
        align: "justify",
      });
    },
  );

  const footerY = rect.y + rect.height - 26;
  ctx.font = font("sans", 500, 13);
  over({ x: titleX, y: footerY - 14, width: 460, height: 18 }, () => {
    ctx.font = font("sans", 500, 13);
    drawTracked(ctx, spec.copy.footer.toUpperCase(), titleX, footerY, 2.4);
  });

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

function drawNotch(context: RenderContext) {
  const { ctx, spec } = context;
  const gridHeight = 1180;
  paintField(context, {
    x: MARGIN,
    y: MARGIN,
    width: LIVE_WIDTH,
    height: gridHeight,
  });

  const notchY = MARGIN + 330;
  const notchWidth = LIVE_WIDTH * 0.76;
  ctx.fillStyle = PAPER;
  ctx.fillRect(MARGIN, notchY, notchWidth, MARGIN + gridHeight - notchY + 1);

  const inner = notchWidth - 48;
  const columnWidth = (inner - 44) / 2;

  ctx.fillStyle = INK;
  fitSize(ctx, spec.copy.title, inner, "sans", 400, 54, 24);
  ctx.fillText(spec.copy.title, MARGIN + 24, notchY + 78);

  ctx.font = font("serif", 400, BODY_SIZE);
  drawParagraph(ctx, spec.copy.body, {
    x: MARGIN + 24,
    y: notchY + 132,
    width: columnWidth,
    lineHeight: BODY_LEADING,
    maxLines: 14,
    align: "justify",
  });
  drawParagraph(ctx, spec.copy.bodyAlt, {
    x: MARGIN + 24 + columnWidth + 44,
    y: notchY + 246,
    width: columnWidth,
    lineHeight: BODY_LEADING,
    maxLines: 14,
    align: "justify",
  });

  const size = fitSize(ctx, spec.copy.subtitle, inner, "sans", 400, 54, 24);
  ctx.fillText(
    spec.copy.subtitle,
    MARGIN + 24 + inner - ctx.measureText(spec.copy.subtitle).width,
    MARGIN + gridHeight - 96,
  );
  void size;

  drawColophon(context, POSTER_SHEET.height - MARGIN, MARGIN + LIVE_WIDTH);
  drawRail(context);
}

function drawMasthead(context: RenderContext) {
  const { ctx, spec } = context;
  const rect = { x: MARGIN, y: MARGIN, width: LIVE_WIDTH, height: 1180 };
  const blocks = paintField(context, rect);
  const over = (bounds: Rect, draw: () => void) =>
    paintOverBlocks(ctx, blocks, rect, bounds, INK, draw);

  const right = MARGIN + LIVE_WIDTH - 34;
  const titleSize = fitSize(
    ctx,
    spec.copy.title,
    LIVE_WIDTH * 0.78,
    "sans",
    400,
    62,
    26,
  );
  const titleWidth = ctx.measureText(spec.copy.title).width;
  const titleBaseline = MARGIN + 42 + titleSize * 0.78;
  over(
    {
      x: right - titleWidth,
      y: titleBaseline - titleSize * 0.8,
      width: titleWidth,
      height: titleSize,
    },
    () => {
      ctx.font = font("sans", 400, titleSize);
      ctx.fillText(spec.copy.title, right - titleWidth, titleBaseline);
    },
  );

  ctx.font = font("sans", 400, 26);
  const subtitleWidth = ctx.measureText(spec.copy.subtitle).width;
  over(
    {
      x: right - subtitleWidth,
      y: titleBaseline + 24,
      width: subtitleWidth,
      height: 28,
    },
    () => {
      ctx.font = font("sans", 400, 26);
      ctx.fillText(
        spec.copy.subtitle,
        right - subtitleWidth,
        titleBaseline + 46,
      );
    },
  );

  const bodyX = MARGIN + LIVE_WIDTH * 0.28;
  const bodyWidth = LIVE_WIDTH * 0.68;
  const bodyY = MARGIN + 1010;
  const lines = 8;
  over(
    { x: bodyX, y: bodyY - 16, width: bodyWidth, height: lines * BODY_LEADING },
    () => drawBodyPair(context, bodyX, bodyY, bodyWidth, lines, null),
  );

  drawColophon(context, POSTER_SHEET.height - MARGIN, MARGIN + LIVE_WIDTH);
}

function drawRotated(context: RenderContext) {
  const { ctx, spec } = context;
  const gridHeight = 1180;
  const rect = { x: MARGIN, y: MARGIN, width: LIVE_WIDTH, height: gridHeight };
  const blocks = paintField(context, rect);
  const over = (bounds: Rect, draw: () => void) =>
    paintOverBlocks(ctx, blocks, rect, bounds, INK, draw);

  ctx.font = font("sans", 400, 36);
  const subtitleWidth = ctx.measureText(spec.copy.subtitle).width;
  over(
    { x: MARGIN + 34, y: MARGIN + 40, width: subtitleWidth, height: 44 },
    () => {
      ctx.font = font("sans", 400, 36);
      ctx.fillText(spec.copy.subtitle, MARGIN + 34, MARGIN + 74);
    },
  );

  const titleX = MARGIN + 92;
  const titleSize = fitSize(
    ctx,
    spec.copy.title,
    gridHeight - 240,
    "sans",
    400,
    78,
    30,
  );
  const titleLength = ctx.measureText(spec.copy.title).width;
  const titleFoot = MARGIN + gridHeight - 46;
  over(
    {
      x: titleX - titleSize * 0.8,
      y: titleFoot - titleLength,
      width: titleSize,
      height: titleLength,
    },
    () => {
      ctx.font = font("sans", 400, titleSize);
      rotated(ctx, titleX, titleFoot, -Math.PI / 2, () => {
        ctx.fillText(spec.copy.title, 0, 0);
      });
    },
  );

  const bodyX = MARGIN + LIVE_WIDTH * 0.46;
  const bodyWidth = 178;
  const leading = 17.5;
  const lines = 12;
  const firstY = MARGIN + 430;
  const secondY = MARGIN + 710;

  ctx.font = font("serif", 400, 14);
  for (const column of [
    { text: spec.copy.bodyAlt, y: firstY },
    { text: spec.copy.body, y: secondY },
  ]) {
    over(
      {
        x: bodyX,
        y: column.y - 14,
        width: bodyWidth,
        height: lines * leading,
      },
      () => {
        ctx.font = font("serif", 400, 14);
        drawParagraph(ctx, column.text, {
          x: bodyX,
          y: column.y,
          width: bodyWidth,
          lineHeight: leading,
          maxLines: lines,
          align: "justify",
        });
      },
    );
  }

  drawColophon(context, POSTER_SHEET.height - MARGIN, MARGIN + LIVE_WIDTH);
}

function drawPanel(context: RenderContext) {
  const { ctx, spec } = context;
  const gridHeight = 1180;
  paintField(context, {
    x: MARGIN,
    y: MARGIN,
    width: LIVE_WIDTH,
    height: gridHeight,
  });

  const panelX = MARGIN + 48;
  const panelY = MARGIN + 380;
  const panelWidth = LIVE_WIDTH - 168;
  const panelHeight = 560;

  ctx.fillStyle = PAPER;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  paperTexture(ctx, panelX, panelY, panelWidth, panelHeight, {
    seed: spec.seed + 7,
    intensity: spec.grain * 0.5,
    creases: false,
  });

  const pad = 44;
  const innerX = panelX + pad;
  const innerWidth = panelWidth - pad * 2;

  ctx.fillStyle = INK;
  const titleSize = fitSize(
    ctx,
    spec.copy.title,
    innerWidth,
    "sans",
    400,
    50,
    22,
  );
  ctx.fillText(spec.copy.title, innerX, panelY + pad + titleSize * 0.8);

  drawBodyPair(context, innerX, panelY + pad + titleSize + 60, innerWidth, 12);

  ctx.fillStyle = INK;
  fitSize(ctx, spec.copy.subtitle, innerWidth, "sans", 400, 40, 20);
  ctx.fillText(
    spec.copy.subtitle,
    innerX + innerWidth - ctx.measureText(spec.copy.subtitle).width,
    panelY + panelHeight - pad,
  );

  drawColophon(context, POSTER_SHEET.height - MARGIN, MARGIN + LIVE_WIDTH);
  drawRail(context);
}

function drawLedger(context: RenderContext) {
  const { ctx, spec } = context;
  const paperWidth = 424;
  const gridX = MARGIN + paperWidth + 48;

  paintField(context, {
    x: gridX,
    y: MARGIN,
    width: POSTER_SHEET.width - MARGIN - gridX,
    height: 1180,
  });

  ctx.fillStyle = INK;
  fitSize(ctx, spec.copy.title, paperWidth, "sans", 400, 46, 22);
  ctx.fillText(spec.copy.title, MARGIN, MARGIN + 64);

  drawBodyPair(context, MARGIN, MARGIN + 176, paperWidth, 16);

  fitSize(ctx, spec.copy.subtitle, paperWidth, "sans", 400, 46, 22);
  ctx.fillStyle = INK;
  ctx.fillText(spec.copy.subtitle, MARGIN, MARGIN + 960);

  drawColophon(
    context,
    POSTER_SHEET.height - MARGIN,
    POSTER_SHEET.width - MARGIN,
  );
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
    case "notch":
      drawNotch(context);
      break;
    case "panel":
      drawPanel(context);
      break;
    case "masthead":
      drawMasthead(context);
      break;
    case "rotated":
      drawRotated(context);
      break;
    case "ledger":
      drawLedger(context);
      break;
    case "diptych":
      drawDiptych(context);
      break;
    default:
      drawStack(context);
  }

  if (spec.posterVariant !== "diptych") {
    paperTexture(ctx, 0, 0, POSTER_SHEET.width, POSTER_SHEET.height, {
      seed: spec.seed + 101,
      intensity: spec.grain * 0.28,
      creases: false,
    });
  }
}
