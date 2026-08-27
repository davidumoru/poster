"use client";

import { Field, FieldTitle } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";

type DialProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

export function Dial({ label, value, min, max, step, onChange }: DialProps) {
  const decimals = step < 1 ? (step < 0.1 ? 2 : 1) : 0;

  return (
    <Field className="gap-2">
      <FieldTitle className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </FieldTitle>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        valueLabel={value.toFixed(decimals)}
        onValueChange={(next) => {
          const [first] = Array.isArray(next) ? next : [next];
          if (typeof first === "number") onChange(first);
        }}
      />
    </Field>
  );
}
