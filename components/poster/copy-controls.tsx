"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Copy, PosterSpec } from "@/lib/poster/types";

type CopyControlsProps = {
  spec: PosterSpec;
  onChange: (key: keyof Copy, value: string) => void;
};

const LINES: { key: keyof Copy; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "subtitle", label: "Subtitle" },
  { key: "kicker", label: "Attribution" },
  { key: "meta", label: "Year" },
  { key: "footer", label: "Colophon" },
  { key: "mark", label: "Rights" },
];

const BLOCKS: { key: keyof Copy; label: string }[] = [
  { key: "body", label: "Body, first column" },
  { key: "bodyAlt", label: "Body, second column" },
];

export function CopyControls({ spec, onChange }: CopyControlsProps) {
  return (
    <div className="flex flex-col gap-5">
      {LINES.map(({ key, label }) => (
        <Field key={key} className="gap-2">
          <FieldLabel
            htmlFor={`copy-${key}`}
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            {label}
          </FieldLabel>
          <Input
            id={`copy-${key}`}
            value={spec.copy[key]}
            onChange={(event) => onChange(key, event.target.value)}
          />
        </Field>
      ))}

      {BLOCKS.map(({ key, label }) => (
        <Field key={key} className="gap-2">
          <FieldLabel
            htmlFor={`copy-${key}`}
            className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
          >
            {label}
          </FieldLabel>
          <Textarea
            id={`copy-${key}`}
            rows={5}
            value={spec.copy[key]}
            onChange={(event) => onChange(key, event.target.value)}
            className="resize-none leading-relaxed"
          />
        </Field>
      ))}
    </div>
  );
}
