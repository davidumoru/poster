import { PALETTES } from "@/lib/poster/palettes";
import type {
  CoverVariant,
  Family,
  FieldVariant,
  PosterSpec,
  PosterVariant,
} from "@/lib/poster/types";

export const FAMILIES: { id: Family; label: string; detail: string }[] = [
  {
    id: "cover",
    label: "Cover",
    detail: "Procedural field, editorial caption",
  },
  { id: "poster", label: "Poster", detail: "Modular colour grid, Swiss type" },
];

export const FIELD_VARIANTS: { id: FieldVariant; label: string }[] = [
  { id: "contour", label: "Contour" },
  { id: "topo", label: "Topo" },
  { id: "lava", label: "Lava" },
  { id: "ribbons", label: "Ribbons" },
  { id: "signal", label: "Signal" },
  { id: "cells", label: "Cells" },
  { id: "moire", label: "Moire" },
  { id: "weave", label: "Weave" },
  { id: "burst", label: "Burst" },
  { id: "blocks", label: "Blocks" },
];

export const COVER_VARIANTS: { id: CoverVariant; label: string }[] = [
  { id: "specimen", label: "Specimen" },
  { id: "bleed", label: "Bleed" },
  { id: "index", label: "Index card" },
];

export const POSTER_VARIANTS: { id: PosterVariant; label: string }[] = [
  { id: "stack", label: "Stack" },
  { id: "overlay", label: "Overlay" },
  { id: "sidebar", label: "Sidebar" },
  { id: "banner", label: "Banner" },
  { id: "diptych", label: "Diptych" },
];

type FieldDefaults = Pick<
  PosterSpec,
  "density" | "warp" | "bands" | "scan" | "drift" | "grain"
>;

export const FIELD_DEFAULTS: Record<FieldVariant, FieldDefaults> = {
  contour: {
    density: 5.2,
    warp: 1.05,
    bands: 5,
    scan: 0.02,
    drift: 0.18,
    grain: 0.34,
  },
  topo: {
    density: 4.6,
    warp: 1,
    bands: 6,
    scan: 0.02,
    drift: 0.16,
    grain: 0.3,
  },
  lava: {
    density: 8,
    warp: 1.1,
    bands: 6,
    scan: 0.35,
    drift: 0.4,
    grain: 0.36,
  },
  ribbons: {
    density: 6.4,
    warp: 0.6,
    bands: 6,
    scan: 0.02,
    drift: 0.16,
    grain: 0.3,
  },
  signal: {
    density: 6.6,
    warp: 1.4,
    bands: 5,
    scan: 0.62,
    drift: 0.34,
    grain: 0.4,
  },
  cells: {
    density: 7.6,
    warp: 1.1,
    bands: 5,
    scan: 0.06,
    drift: 0.2,
    grain: 0.32,
  },
  moire: {
    density: 9.2,
    warp: 0.7,
    bands: 6,
    scan: 0.12,
    drift: 0.3,
    grain: 0.28,
  },
  weave: {
    density: 7.4,
    warp: 0.45,
    bands: 5,
    scan: 0.1,
    drift: 0.18,
    grain: 0.3,
  },
  burst: {
    density: 8.4,
    warp: 1.2,
    bands: 7,
    scan: 0.03,
    drift: 0.28,
    grain: 0.32,
  },
  blocks: {
    density: 9.5,
    warp: 1.3,
    bands: 5,
    scan: 0.55,
    drift: 0.36,
    grain: 0.38,
  },
};

export const POSTER_DEFAULTS: FieldDefaults = {
  density: 6.8,
  warp: 0.55,
  bands: 6,
  scan: 0,
  drift: 0.5,
  grain: 0.62,
};

export const DEFAULT_COPY: PosterSpec["copy"] = {
  title: "Ordinary Light",
  subtitle: "Study No. 04",
  kicker: "Poster Press",
  meta: "2026",
  body: "Flat colour turns a surface into a field of rhythm. Bold reds, blues and yellows meet in unexpected proportions, each shape shifting the balance of the whole. Some tones press forward while others quietly recede, creating movement without motion.",
  bodyAlt:
    "Every block carries its own weight, and becomes more expressive through its neighbours. The arrangement feels spontaneous but stays carefully balanced, so that simple geometry turns into a conversation between contrast, harmony and tension.",
  footer: "Edition of 50 · Risograph on Mohawk",
  mark: "© Poster Press",
};

export const DEFAULT_SPEC: PosterSpec = {
  family: "cover",
  fieldVariant: "contour",
  coverVariant: "specimen",
  posterVariant: "stack",
  seed: 207195,
  ...FIELD_DEFAULTS.contour,
  palette: PALETTES[1],
  sourceName: "",
  copy: DEFAULT_COPY,
};

export function randomSeed() {
  return Math.floor(100000 + Math.random() * 899999);
}
