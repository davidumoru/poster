"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

const MAX_TICKS = 12;

type SliderProps = SliderPrimitive.Root.Props & {
  valueLabel?: React.ReactNode;
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  valueLabel,
  ...props
}: SliderProps) {
  const values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  const percent = max > min ? ((values[0] - min) / (max - min)) * 100 : 0;
  const steps = step > 0 ? Math.round((max - min) / step) : 0;
  const ticks = steps > 1 && steps <= MAX_TICKS ? steps : 0;

  const label = valueLabel ? (
    <span className="absolute inset-y-0 left-5 flex items-center text-sm font-medium tabular-nums whitespace-nowrap">
      {valueLabel}
    </span>
  ) : null;

  return (
    <SliderPrimitive.Root
      className={cn("w-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-9 w-full touch-none items-center select-none data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-full w-full overflow-hidden rounded-xl bg-primary/10 select-none"
        >
          {Array.from({ length: ticks - 1 }, (_, index) => (
            <span
              key={index}
              aria-hidden
              className="absolute top-1/2 h-3 w-0.75 -translate-y-1/2 rounded-full bg-primary/15"
              style={{ left: `calc(${((index + 1) / ticks) * 100}% - 1.5px)` }}
            />
          ))}

          {/* Drawn twice at one offset so the fill clips it mid-glyph. */}
          <span aria-hidden className="text-muted-foreground">
            {label}
          </span>

          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "relative h-full overflow-hidden rounded-xl bg-primary text-primary-foreground select-none",
              percent < 1.5 && "opacity-0",
            )}
          >
            <span aria-hidden>{label}</span>
          </SliderPrimitive.Indicator>
        </SliderPrimitive.Track>

        {values.map((_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="h-4 w-1.25 shrink-0 rounded-full bg-background ring-1 shadow-sm ring-primary/30 transition-shadow select-none focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-hidden"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
