"use client";

import * as React from "react";

type StageProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  label: string;
};

export function Stage({ canvasRef, label }: StageProps) {
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/60 p-6 lg:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55] bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[22px_22px]"
      />
      <canvas
        ref={canvasRef}
        aria-label={label}
        role="img"
        className="relative max-h-full max-w-full shadow-[0_24px_70px_-24px_rgb(0_0_0/0.45)] ring-1 ring-black/5"
      />
    </div>
  );
}
