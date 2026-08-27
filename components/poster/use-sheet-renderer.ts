"use client";

import * as React from "react";

import { renderSheet } from "@/lib/poster/render";
import { resetFontStacks } from "@/lib/poster/text";
import type { PosterSpec } from "@/lib/poster/types";

export const PREVIEW_SCALE = 1.5;
export const PREVIEW_RESOLUTION = 384;

/** Fields cost a full pixel pass, so they animate at a lower frame budget. */
const FRAME_INTERVAL: Record<PosterSpec["family"], number> = {
  cover: 1000 / 18,
  poster: 1000 / 40,
};

type Options = {
  spec: PosterSpec;
  source: HTMLImageElement | null;
  animated: boolean;
};

export function useSheetRenderer({ spec, source, animated }: Options) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const timeRef = React.useRef(0);
  const [fontsReady, setFontsReady] = React.useState(false);

  // Metrics measured before the webfont lands are wrong, so wait, then
  // re-resolve the family names cached for canvas.
  React.useEffect(() => {
    let active = true;

    document.fonts?.ready.then(() => {
      if (!active) return;
      resetFontStacks();
      setFontsReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () =>
      renderSheet(canvas, spec, {
        source,
        time: timeRef.current,
        scale: PREVIEW_SCALE,
        resolution: PREVIEW_RESOLUTION,
      });

    if (!animated) {
      draw();
      return;
    }

    let frame = 0;
    let previous = performance.now();
    let accumulated = 0;
    const interval = FRAME_INTERVAL[spec.family];

    const tick = (now: number) => {
      const delta = now - previous;
      previous = now;
      timeRef.current += delta / 1000;
      accumulated += delta;

      if (accumulated >= interval) {
        accumulated = 0;
        draw();
      }

      frame = requestAnimationFrame(tick);
    };

    draw();
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [spec, source, animated, fontsReady]);

  const redraw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderSheet(canvas, spec, {
      source,
      time: timeRef.current,
      scale: PREVIEW_SCALE,
      resolution: PREVIEW_RESOLUTION,
    });
  }, [spec, source]);

  return { canvasRef, timeRef, redraw, fontsReady };
}
