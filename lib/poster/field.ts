import { buildRamp, hexToRgb } from "@/lib/poster/color";
import {
  cellField,
  clamp,
  fbm,
  hash,
  quantize,
  valueNoise,
} from "@/lib/poster/rng";
import type { FieldVariant, PosterSpec } from "@/lib/poster/types";

/**
 * The procedural field behind every cover. One pass over a square buffer,
 * quantised hard onto the palette ramp so the result prints like flat spot
 * colour rather than a gradient.
 */

const VARIANT_INDEX: Record<FieldVariant, number> = {
  contour: 0,
  topo: 1,
  lava: 2,
  ribbons: 3,
  signal: 4,
  cells: 5,
  moire: 6,
  weave: 7,
  burst: 8,
  blocks: 9,
};

type Buffer = {
  canvas: HTMLCanvasElement;
  image: ImageData;
  /** Raw field values, held between the sampling and the quantisation pass. */
  values: Float32Array;
  /** Signature of the last pass, so unrelated edits skip the pixel loop. */
  key: string;
};

const buffers = new Map<number, Buffer>();

function getBuffer(resolution: number) {
  const existing = buffers.get(resolution);
  if (existing) return existing;

  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");

  const entry: Buffer = {
    canvas,
    image: ctx.createImageData(resolution, resolution),
    values: new Float32Array(resolution * resolution),
    key: "",
  };
  buffers.set(resolution, entry);
  return entry;
}

function fieldKey(spec: PosterSpec, time: number) {
  const phase = spec.drift > 0 ? Math.round(time * spec.drift * 1000) : 0;
  return [
    spec.fieldVariant,
    spec.seed,
    spec.density,
    spec.warp,
    spec.bands,
    spec.scan,
    phase,
    spec.palette.colors.join(""),
  ].join("|");
}

const HISTOGRAM_BINS = 512;
/** How far the tone curve is pulled towards perfectly equal band areas. */
const BALANCE = 0.85;

/**
 * Every field function is bell-shaped around its midpoint, which would hand
 * one band most of the sheet. Flattening the histogram gives each colour a
 * comparable share, which is what makes flat-colour printing read as designed.
 */
function equalise(values: Float32Array, bands: number) {
  const histogram = new Uint32Array(HISTOGRAM_BINS);
  for (let i = 0; i < values.length; i++) {
    histogram[Math.min(HISTOGRAM_BINS - 1, (values[i] * HISTOGRAM_BINS) | 0)]++;
  }

  const lookup = new Uint8Array(HISTOGRAM_BINS);
  let running = 0;
  for (let bin = 0; bin < HISTOGRAM_BINS; bin++) {
    running += histogram[bin];
    const flattened = running / values.length;
    const raw = (bin + 0.5) / HISTOGRAM_BINS;
    const blended = raw + (flattened - raw) * BALANCE;
    lookup[bin] = quantize(clamp(blended, 0, 0.9999), bands);
  }

  return (value: number) =>
    lookup[Math.min(HISTOGRAM_BINS - 1, (value * HISTOGRAM_BINS) | 0)];
}

export type FieldOptions = {
  resolution?: number;
  time?: number;
};

export function renderField(spec: PosterSpec, options: FieldOptions = {}) {
  const resolution = options.resolution ?? 384;
  const time = options.time ?? 0;
  const buffer = getBuffer(resolution);
  const { canvas, image, values } = buffer;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const key = fieldKey(spec, time);
  if (key === buffer.key) return canvas;
  buffer.key = key;

  const ramp = buildRamp(spec.palette.colors, spec.bands).map(hexToRgb);
  const bands = ramp.length;
  const variant = VARIANT_INDEX[spec.fieldVariant] ?? 0;
  const phase = time * spec.drift;
  const { data } = image;
  const size = resolution;

  // Contiguous horizontal slices, so `signal` tears in strips rather than
  // per-scanline confetti.
  const sliceHeight = Math.max(1, Math.round(size / (14 + spec.scan * 44)));

  for (let y = 0; y < size; y++) {
    const slice = Math.floor(y / sliceHeight);
    const sliceNoise = hash(slice * 73.13 + spec.seed * 1.7);
    const rowNoise = valueNoise(y * 0.19, spec.seed, spec.seed + 4);
    const rowShift =
      variant === 4 || variant === 9
        ? Math.round((sliceNoise - 0.5) * spec.scan * size * 0.45)
        : Math.round((rowNoise - 0.5) * spec.scan * size * 0.12);

    for (let x = 0; x < size; x++) {
      const px = (x + rowShift + size) % size;
      const nx = px / size - 0.5;
      const ny = y / size - 0.5;
      // Three octaves at a low frequency: the warp should bend the field in
      // broad strokes, not stir fine detail into every coordinate.
      const warpX = fbm(nx * 1.5 + phase, ny * 1.5, spec.seed + 1, 3) - 0.5;
      const warpY = fbm(nx * 1.5, ny * 1.5 - phase, spec.seed + 2, 3) - 0.5;
      const wx = nx * spec.density + warpX * spec.warp * 3;
      const wy = ny * spec.density + warpY * spec.warp * 3;

      let value: number;

      switch (variant) {
        // contour — soft masses broken by concentric interference
        case 0: {
          const rings = Math.abs(Math.sin((wx * wx + wy * wy) * 1.2 + phase));
          value = fbm(wx * 0.85 + rings * 0.35, wy * 0.85, spec.seed + 7, 4);
          break;
        }
        // topo — ridged noise read as survey contours
        case 1: {
          const ridge = fbm(
            wx * 0.5 + phase * 0.4,
            wy * 0.5,
            spec.seed + 53,
            4,
          );
          const rings = Math.abs(
            Math.sin((ridge * 3.2 + wx * 0.14 - wy * 0.08) * Math.PI),
          );
          value = Math.pow(1 - rings, 0.55);
          break;
        }
        // lava — heavy, slow-moving flow
        case 2: {
          value =
            fbm(wx * 0.75 + phase * 1.7, wy * 1.2, spec.seed + 13, 4) * 0.65 +
            Math.sin(wy * 3.8 + phase * 2.4) * 0.18 +
            Math.sin(wx * 2.2) * 0.14;
          break;
        }
        // ribbons — diagonal bands with a lazy wobble
        case 3: {
          value =
            0.5 +
            0.48 *
              Math.sin(
                wx * 1.05 -
                  wy * 3.1 +
                  Math.sin(wy * 0.9 + phase * 1.6) * spec.warp * 1.8,
              );
          break;
        }
        // signal — the field torn along its slices and dropped out
        case 4: {
          const jitter = (sliceNoise - 0.5) * spec.scan * 1.4;
          value = fbm(
            wx * 0.9 + jitter,
            wy * 0.9 - phase * 2,
            spec.seed + 31,
            4,
          );
          if (sliceNoise < spec.scan * 0.22) value = 1 - value;
          break;
        }
        // cells — packed plates
        case 5: {
          const cells =
            cellField(
              (nx + warpX * spec.warp * 0.28 + phase * 0.08) * spec.density,
              (ny + warpY * spec.warp * 0.28) * spec.density,
              spec.seed + 41,
            ) * 2.4;
          value = cells + fbm(wx * 0.28, wy * 0.28, spec.seed) * 0.28;
          break;
        }
        // moire — two rulings beating against each other
        case 6: {
          const angleA = wx * 1.35 + Math.sin(wy * 0.45 + phase) * spec.warp;
          const angleB = wy * 1.18 - Math.cos(wx * 0.42 - phase) * spec.warp;
          value =
            0.5 +
            0.25 * Math.sin(angleA * Math.PI) +
            0.25 * Math.sin(angleB * Math.PI);
          break;
        }
        // weave — warp and weft crossing
        case 7: {
          const warpLine = Math.sin((wx + warpY * 0.7) * Math.PI * 1.1 + phase);
          const weftLine = Math.sin((wy + warpX * 0.7) * Math.PI * 1.1 - phase);
          const stitch = Math.max(Math.abs(warpLine), Math.abs(weftLine));
          value =
            1 -
            stitch * 0.72 +
            fbm(wx * 0.45, wy * 0.45, spec.seed + 67, 3) * 0.3;
          break;
        }
        // burst — radial spokes from the centre
        case 8: {
          const radius = Math.sqrt(nx * nx + ny * ny) * spec.density;
          const angle = Math.atan2(ny + warpY * 0.12, nx + warpX * 0.12);
          const spokes = Math.sin(angle * 12 + radius * 1.15 - phase * 3.2);
          value =
            0.48 +
            spokes * 0.28 +
            Math.sin(radius * 2.5 + phase) * 0.16 +
            fbm(wx * 0.35, wy * 0.35, spec.seed + 79, 4) * 0.22;
          break;
        }
        // blocks — the field resampled onto a coarse grid
        default: {
          const block = Math.max(4, Math.floor(30 - spec.scan * 20));
          const bx = Math.floor(px / block);
          const by = Math.floor(y / block);
          const blockNoise = hash(bx * 101.3 + by * 61.7 + spec.seed);
          value =
            fbm(
              ((bx * block) / size) * spec.density * 2,
              ((by * block) / size) * spec.density * 1.7 - phase,
              spec.seed + 89,
              4,
            ) *
              0.8 +
            blockNoise * 0.22;
          break;
        }
      }

      values[y * size + x] = clamp(value, 0, 0.9999);
    }
  }

  const bandFor = equalise(values, bands);

  for (let index = 0; index < values.length; index++) {
    const [r, g, b] = ramp[bandFor(values[index])];
    const offset = index * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Mean brightness of a normalised region of a rendered field, for choosing
 * ink that stays legible over whatever the field happens to put there.
 */
export function sampleLuminance(
  canvas: HTMLCanvasElement,
  left: number,
  top: number,
  right: number,
  bottom: number,
) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;

  const x = Math.floor(left * canvas.width);
  const y = Math.floor(top * canvas.height);
  const width = Math.max(1, Math.floor((right - left) * canvas.width));
  const height = Math.max(1, Math.floor((bottom - top) * canvas.height));
  const { data } = ctx.getImageData(x, y, width, height);

  let total = 0;
  // Every eighth pixel is plenty for an average.
  for (let i = 0; i < data.length; i += 32) {
    total += data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  }

  return total / (data.length / 32);
}
