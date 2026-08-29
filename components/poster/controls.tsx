"use client";

import { CopyControls } from "@/components/poster/copy-controls";
import { Dial } from "@/components/poster/dial";
import { OptionGrid } from "@/components/poster/option-grid";
import { PaletteControls } from "@/components/poster/palette-controls";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COVER_VARIANTS,
  FAMILIES,
  FIELD_VARIANTS,
  POSTER_VARIANTS,
} from "@/lib/poster/defaults";
import type {
  Copy,
  CoverVariant,
  Family,
  FieldVariant,
  Palette,
  PosterSpec,
  PosterVariant,
} from "@/lib/poster/types";

export type ControlsProps = {
  spec: PosterSpec;
  sourceUrl: string | null;
  onFamily: (family: Family) => void;
  onFieldVariant: (variant: FieldVariant) => void;
  onCoverVariant: (variant: CoverVariant) => void;
  onPosterVariant: (variant: PosterVariant) => void;
  onNumber: (
    key: "density" | "warp" | "bands" | "scan" | "drift" | "grain",
    value: number,
  ) => void;
  onPalette: (palette: Palette) => void;
  onSeed: (seed: number) => void;
  onShuffleSeed: () => void;
  onFile: (file: File) => void;
  onClearSource: () => void;
  onExtractFromSource: () => void;
  onCopy: (key: keyof Copy, value: string) => void;
};

export function Controls(props: ControlsProps) {
  const { spec } = props;
  const isCover = spec.family === "cover";

  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-10">
      <section className="flex flex-col gap-4">
        <OptionGrid
          label="Family"
          value={spec.family}
          options={FAMILIES}
          onChange={props.onFamily}
        />
        <p className="-mt-1 text-xs leading-relaxed text-muted-foreground">
          {FAMILIES.find((family) => family.id === spec.family)?.detail}
        </p>
        {isCover ? (
          <OptionGrid
            label="Layout"
            value={spec.coverVariant}
            options={COVER_VARIANTS}
            onChange={props.onCoverVariant}
            columns={3}
          />
        ) : (
          <OptionGrid
            label="Layout"
            value={spec.posterVariant}
            options={POSTER_VARIANTS}
            onChange={props.onPosterVariant}
          />
        )}
      </section>

      <Separator />

      <Tabs defaultValue="form">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="colour">Colour</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="pt-5">
          <div className="flex flex-col gap-7">
            {isCover ? (
              <>
                <OptionGrid
                  label="Field"
                  value={spec.fieldVariant}
                  options={FIELD_VARIANTS}
                  onChange={props.onFieldVariant}
                />
                <div className="flex flex-col gap-5">
                  <Dial
                    label="Density"
                    value={spec.density}
                    min={3}
                    max={14}
                    step={0.1}
                    onChange={(value) => props.onNumber("density", value)}
                  />
                  <Dial
                    label="Warp"
                    value={spec.warp}
                    min={0}
                    max={2.8}
                    step={0.05}
                    onChange={(value) => props.onNumber("warp", value)}
                  />
                  <Dial
                    label="Bands"
                    value={spec.bands}
                    min={3}
                    max={12}
                    step={1}
                    onChange={(value) => props.onNumber("bands", value)}
                  />
                  <Dial
                    label="Scan"
                    value={spec.scan}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => props.onNumber("scan", value)}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-5">
                <Dial
                  label="Shift"
                  value={spec.warp}
                  min={0}
                  max={2.8}
                  step={0.05}
                  onChange={(value) => props.onNumber("warp", value)}
                />
                <Dial
                  label="Ghost"
                  value={spec.scan}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => props.onNumber("scan", value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-5">
              <Dial
                label="Grain"
                value={spec.grain}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => props.onNumber("grain", value)}
              />
              <Dial
                label="Motion"
                value={spec.drift}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => props.onNumber("drift", value)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colour" className="pt-5">
          <PaletteControls
            spec={spec}
            sourceUrl={props.sourceUrl}
            onPalette={props.onPalette}
            onSeed={props.onSeed}
            onShuffleSeed={props.onShuffleSeed}
            onFile={props.onFile}
            onClearSource={props.onClearSource}
            onExtractFromSource={props.onExtractFromSource}
          />
        </TabsContent>

        <TabsContent value="type" className="pt-5">
          <CopyControls spec={spec} onChange={props.onCopy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
