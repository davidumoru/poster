export type Family = "cover" | "poster";

/** Procedural field used by the cover family. */
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

/** Sheet layout for the cover family. */
export type CoverVariant = "specimen" | "bleed" | "index";

/** Sheet layout for the modular colour-grid family. */
export type PosterVariant =
  | "stack"
  | "overlay"
  | "sidebar"
  | "banner"
  | "diptych";

export type Palette = {
  name: string;
  colors: string[];
};

export type Copy = {
  /** Primary headline. */
  title: string;
  /** Secondary headline, set at the same weight. */
  subtitle: string;
  /** Small attribution line under the title. */
  kicker: string;
  /** Year or catalogue number. */
  meta: string;
  body: string;
  bodyAlt: string;
  /** Address / venue line set in tracked micro-caps. */
  footer: string;
  /** Rights line. */
  mark: string;
};

export type PosterSpec = {
  family: Family;
  fieldVariant: FieldVariant;
  coverVariant: CoverVariant;
  posterVariant: PosterVariant;
  seed: number;
  /** Field frequency. */
  density: number;
  /** Domain warp for fields; block displacement for grids. */
  warp: number;
  /** Number of quantisation steps the field collapses into. */
  bands: number;
  /** Horizontal slicing / glitch. */
  scan: number;
  /** Animation speed. */
  drift: number;
  /** Paper texture strength. */
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
  /** Pixel resolution of the procedural field buffer. */
  resolution: number;
};
