"use client";

import * as React from "react";
import {
  DownloadSimpleIcon,
  PauseIcon,
  PlayIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

import { Controls } from "@/components/poster/controls";
import { Stage } from "@/components/poster/stage";
import { useSheetRenderer } from "@/components/poster/use-sheet-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { extractPalette } from "@/lib/poster/color";
import {
  COVER_VARIANTS,
  DEFAULT_SPEC,
  FIELD_DEFAULTS,
  FIELD_VARIANTS,
  POSTER_DEFAULTS,
  POSTER_VARIANTS,
  randomSeed,
} from "@/lib/poster/defaults";
import { DEFAULT_PALETTE, PALETTES } from "@/lib/poster/palettes";
import { exportSheet, fileNameFor, sheetFor } from "@/lib/poster/render";
import type {
  Copy,
  CoverVariant,
  Family,
  FieldVariant,
  Palette,
  PosterSpec,
  PosterVariant,
} from "@/lib/poster/types";

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

// Shuffle leaves the palette alone only while it is the one taken from the
// uploaded image; a hand-picked preset is fair game.
function keepsPalette(spec: PosterSpec) {
  return Boolean(spec.sourceName) && spec.palette.name === spec.sourceName;
}

export function Studio() {
  const [spec, setSpec] = React.useState<PosterSpec>(DEFAULT_SPEC);
  const [source, setSource] = React.useState<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = React.useState<string | null>(null);
  const [animated, setAnimated] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const { canvasRef, timeRef } = useSheetRenderer({
    spec,
    source,
    animated,
  });

  const sheet = sheetFor(spec);
  const variantLabel =
    spec.family === "cover"
      ? COVER_VARIANTS.find((item) => item.id === spec.coverVariant)?.label
      : POSTER_VARIANTS.find((item) => item.id === spec.posterVariant)?.label;

  const patch = React.useCallback((next: Partial<PosterSpec>) => {
    setSpec((current) => ({ ...current, ...next }));
  }, []);

  const applyFamily = React.useCallback((family: Family) => {
    setSpec((current) => ({
      ...current,
      family,
      ...(family === "poster"
        ? POSTER_DEFAULTS
        : FIELD_DEFAULTS[current.fieldVariant]),
    }));
  }, []);

  const applyFieldVariant = React.useCallback((fieldVariant: FieldVariant) => {
    setSpec((current) => ({
      ...current,
      family: "cover",
      fieldVariant,
      ...FIELD_DEFAULTS[fieldVariant],
    }));
  }, []);

  const loadFile = React.useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const name = file.name.replace(/\.[^.]+$/, "");
        const palette = extractPalette(image, name, DEFAULT_PALETTE);
        setSource(image);
        setSourceUrl(image.src);
        setSpec((current) => ({
          ...current,
          palette,
          sourceName: name,
          bands: Math.max(4, Math.min(9, palette.colors.length)),
        }));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearSource = React.useCallback(() => {
    setSource(null);
    setSourceUrl(null);
    setSpec((current) => ({
      ...current,
      sourceName: "",
      palette: DEFAULT_SPEC.palette,
    }));
  }, []);

  const extractFromSource = React.useCallback(() => {
    if (!source) return;
    setSpec((current) => ({
      ...current,
      palette: extractPalette(source, current.sourceName, DEFAULT_PALETTE),
    }));
  }, [source]);

  const shuffleAll = React.useCallback(() => {
    setSpec((current) => {
      if (current.family === "cover") {
        const fieldVariant = pick(FIELD_VARIANTS).id;
        return {
          ...current,
          fieldVariant,
          coverVariant: pick(COVER_VARIANTS).id,
          seed: randomSeed(),
          palette: keepsPalette(current) ? current.palette : pick(PALETTES),
          ...FIELD_DEFAULTS[fieldVariant],
        };
      }

      return {
        ...current,
        posterVariant: pick(POSTER_VARIANTS).id,
        seed: randomSeed(),
        palette: keepsPalette(current) ? current.palette : pick(PALETTES),
      };
    });
  }, []);

  const download = React.useCallback(async () => {
    setExporting(true);
    // Let the spinner paint before the export pass blocks the main thread.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);

    try {
      const blob = await exportSheet(spec, {
        source,
        time: timeRef.current,
        scale: 2,
        resolution: 900,
      });
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFor(spec);
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [spec, source, timeRef]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 border-b px-5 py-3">
        <span className="text-base font-medium tracking-tight">Poster</span>

        <Badge
          variant="secondary"
          className="ml-auto hidden font-mono tabular-nums md:inline-flex"
        >
          {variantLabel} · {sheet.width}×{sheet.height} · {spec.seed}
        </Badge>

        <Separator orientation="vertical" className="hidden h-6 md:block" />

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={animated ? "Pause motion" : "Play motion"}
                  onClick={() => setAnimated((value) => !value)}
                />
              }
            >
              {animated ? <PauseIcon /> : <PlayIcon />}
            </TooltipTrigger>
            <TooltipContent>
              {animated ? "Pause motion" : "Play motion"}
            </TooltipContent>
          </Tooltip>

          <Button variant="outline" size="sm" onClick={shuffleAll}>
            <SparkleIcon data-icon="inline-start" />
            <span className="sr-only sm:not-sr-only">Shuffle</span>
          </Button>

          <Button size="sm" onClick={download} disabled={exporting}>
            {exporting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <DownloadSimpleIcon data-icon="inline-start" />
            )}
            <span className="sr-only sm:not-sr-only">Export</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Stage
          canvasRef={canvasRef}
          label={`${variantLabel} sheet, seed ${spec.seed}`}
        />

        <aside className="flex h-[52dvh] w-full shrink-0 flex-col border-t lg:h-auto lg:w-90 lg:border-t-0 lg:border-l">
          <ScrollArea className="min-h-0 flex-1">
            <Controls
              spec={spec}
              sourceUrl={sourceUrl}
              onFamily={applyFamily}
              onFieldVariant={applyFieldVariant}
              onCoverVariant={(coverVariant: CoverVariant) =>
                patch({ coverVariant })
              }
              onPosterVariant={(posterVariant: PosterVariant) =>
                patch({ posterVariant })
              }
              onNumber={(key, value) => patch({ [key]: value })}
              onPalette={(palette: Palette) => patch({ palette })}
              onSeed={(seed) => patch({ seed })}
              onShuffleSeed={() => patch({ seed: randomSeed() })}
              onFile={loadFile}
              onClearSource={clearSource}
              onExtractFromSource={extractFromSource}
              onCopy={(key: keyof Copy, value: string) =>
                setSpec((current) => ({
                  ...current,
                  copy: { ...current.copy, [key]: value },
                }))
              }
            />
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
