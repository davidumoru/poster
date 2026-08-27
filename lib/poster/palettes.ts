import type { Palette } from "@/lib/poster/types";

/**
 * Colours are ordered light to dark. The field renderer maps quantisation
 * bands onto this order, so the sequence reads as a tonal ramp; the grid
 * renderer shuffles it per seed and treats every entry as an equal player.
 */
export const PALETTES: Palette[] = [
  {
    name: "Dogpatch 97",
    colors: [
      "#ffc907",
      "#86dd5f",
      "#4bc8ab",
      "#2eb3f2",
      "#e33f9e",
      "#ee1b24",
      "#22bb56",
      "#1f43be",
      "#a5121a",
      "#1f6b45",
      "#2b2320",
    ],
  },
  {
    name: "Atom Heart",
    colors: ["#e6f1fa", "#a8d4f0", "#6f8f4e", "#31502c", "#0d1410"],
  },
  {
    name: "Bayou",
    colors: ["#f5d97a", "#a8bd8f", "#5c6b6b", "#3f6b3f", "#16261c"],
  },
  {
    name: "Fun House",
    colors: ["#f7a531", "#f26522", "#d92b1c", "#7a1f14", "#140a06"],
  },
  {
    name: "Electric Ladyland",
    colors: ["#ffd400", "#f0a500", "#c9166f", "#7c5b8f", "#3d2b45"],
  },
  {
    name: "Master Tape",
    colors: ["#a8b0a0", "#b23bee", "#6f7a63", "#333d29", "#0a0d0a"],
  },
  {
    name: "Oracular",
    colors: ["#c9a8e8", "#8fbef0", "#f5163c", "#9a6b5c", "#3b3fd6", "#16233a"],
  },
  {
    name: "Power & Lies",
    colors: ["#e8e6df", "#b088c9", "#7f8a6e", "#7a1f2b", "#131313"],
  },
  {
    name: "Riso Duo",
    colors: ["#fff1d6", "#ffb400", "#ff5a3c", "#2c4bff", "#141428"],
  },
  {
    name: "Press Black",
    colors: ["#f2efe6", "#d8d3c4", "#8a8577", "#3a3730", "#121110"],
  },
];

export const DEFAULT_PALETTE = PALETTES[0];
