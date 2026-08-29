"use client";

import * as React from "react";
import {
  EyedropperIcon,
  ShuffleIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PALETTES } from "@/lib/poster/palettes";
import type { Palette, PosterSpec } from "@/lib/poster/types";

type PaletteControlsProps = {
  spec: PosterSpec;
  sourceUrl: string | null;
  onPalette: (palette: Palette) => void;
  onSeed: (seed: number) => void;
  onShuffleSeed: () => void;
  onFile: (file: File) => void;
  onClearSource: () => void;
  onExtractFromSource: () => void;
};

export function PaletteControls({
  spec,
  sourceUrl,
  onPalette,
  onSeed,
  onShuffleSeed,
  onFile,
  onClearSource,
  onExtractFromSource,
}: PaletteControlsProps) {
  // extractPalette names the palette after the file, so the two match exactly
  // while the palette is still the one taken from the image.
  const paletteFromSource =
    Boolean(spec.sourceName) && spec.palette.name === spec.sourceName;
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-7">
      <Field className="gap-2.5">
        <FieldTitle className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Stock
        </FieldTitle>
        <ToggleGroup
          aria-label="Palette"
          variant="outline"
          value={[spec.palette.name]}
          onValueChange={(next) => {
            const found = PALETTES.find((palette) => palette.name === next[0]);
            if (found) onPalette(found);
          }}
          className="grid w-full grid-cols-2 gap-1.5"
        >
          {PALETTES.map((palette) => (
            <ToggleGroupItem
              key={palette.name}
              value={palette.name}
              className="h-auto flex-col items-stretch gap-1.5 p-1.5 font-normal aria-pressed:border-foreground aria-pressed:bg-transparent"
            >
              <span className="flex h-6 overflow-hidden rounded-[3px]">
                {palette.colors.map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    className="flex-1"
                    style={{ background: color }}
                  />
                ))}
              </span>
              <span className="truncate text-left text-[11px] text-muted-foreground">
                {palette.name}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field className="gap-2.5">
        <FieldTitle className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Source
        </FieldTitle>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
        />
        <Item variant="outline" size="sm" className="p-0">
          {/* The row is the picker, so the clear action sits outside it —
              a button cannot contain another button. */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center gap-2.5 rounded-md px-3 py-2.5 text-left hover:bg-muted/60"
          >
            <ItemMedia variant="image">
              {sourceUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sourceUrl} alt="" />
              ) : (
                <UploadSimpleIcon className="size-4 text-muted-foreground" />
              )}
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="truncate">
                {spec.sourceName || "Choose an image"}
              </ItemTitle>
              <ItemDescription>
                {!sourceUrl
                  ? "Its dominant colours become the palette."
                  : paletteFromSource
                    ? "Palette taken from this image."
                    : "Used as artwork. Palette is set above."}
              </ItemDescription>
            </ItemContent>
          </button>
          {sourceUrl ? (
            <ItemActions className="pr-2">
              {paletteFromSource ? null : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Use this image's colours"
                  onClick={onExtractFromSource}
                >
                  <EyedropperIcon />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove image"
                onClick={onClearSource}
              >
                <XIcon />
              </Button>
            </ItemActions>
          ) : null}
        </Item>
        <div className="flex gap-1.5">
          {spec.palette.colors.map((color, index) => (
            <button
              key={`${color}-${index}`}
              type="button"
              title={color}
              aria-label={`Move ${color} to the front of the ramp`}
              onClick={() =>
                onPalette({
                  ...spec.palette,
                  colors: [
                    color,
                    ...spec.palette.colors.filter((_, i) => i !== index),
                  ],
                })
              }
              className="h-7 flex-1 rounded-[3px] border border-border/60 transition-transform hover:-translate-y-0.5"
              style={{ background: color }}
            />
          ))}
        </div>
        <FieldDescription>
          Click a swatch to promote it to the front of the ramp.
        </FieldDescription>
      </Field>

      <Field className="gap-2.5">
        <FieldTitle className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Seed
        </FieldTitle>
        <InputGroup>
          <InputGroupInput
            type="number"
            value={spec.seed}
            aria-label="Seed"
            onChange={(event) => onSeed(Number(event.target.value) || 0)}
            className="font-mono tabular-nums"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Random seed"
              onClick={onShuffleSeed}
            >
              <ShuffleIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          The seed fixes every layout decision on the sheet.
        </FieldDescription>
      </Field>
    </div>
  );
}
