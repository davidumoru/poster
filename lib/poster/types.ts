export type Family = "cover" | "poster";

export type FieldVariant =
  | "contour"
  | "topo"
  | "lava"
  | "ribbons"
  | "signal"
  | "cells"
  | "moire"
  | "weave"
  | "burst"
  | "blocks";

export type CoverVariant = "specimen" | "bleed" | "index";

export type PosterVariant =
  | "stack"
  | "notch"
  | "panel"
  | "overlay"
  | "masthead"
  | "rotated"
  | "sidebar"
  | "ledger"
  | "banner"
  | "diptych";

export type Palette = {
  name: string;
  colors: string[];
};

export type Copy = {
  title: string;
  subtitle: string;
  kicker: string;
  meta: string;
  body: string;
  bodyAlt: string;
  footer: string;
  mark: string;
};

export type PosterSpec = {
  family: Family;
  fieldVariant: FieldVariant;
  coverVariant: CoverVariant;
  posterVariant: PosterVariant;
  seed: number;
  // density: field frequency. warp: domain warp for fields, block
  // displacement for grids. bands: quantisation steps. scan: horizontal
  // slicing. drift: animation speed. grain: paper texture strength.
  density: number;
  warp: number;
  bands: number;
  scan: number;
  drift: number;
  grain: number;
  palette: Palette;
  sourceName: string;
  copy: Copy;
};

export type Sheet = {
  width: number;
  height: number;
};

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  spec: PosterSpec;
  sheet: Sheet;
  source: HTMLImageElement | null;
  time: number;
  resolution: number;
};
