import { fbm, hash } from "@/lib/poster/rng";

/**
 * Print texture. The reference sheets read as dyed paper stock rather than
 * flat fills, so every colour area gets three passes: fine fibre grain, a
 * slow uneven dye blotch, and a few creases catching the light.
 */

const TILE = 256;
let grainTile: HTMLCanvasElement | null = null;
let blotchTile: HTMLCanvasElement | null = null;

/**
 * Neutral grey noise. Composited with `overlay`, mid-grey is a no-op, so the
 * tile lightens and darkens whatever colour sits underneath without tinting.
 */
function getGrainTile() {
  if (grainTile) return grainTile;

  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(TILE, TILE);
  const { data } = image;

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      // Stretched horizontally so the grain reads as paper fibre, not TV snow.
      const fibre =
        hash(x * 0.71 + y * 311.7) * 0.62 + hash(x * 0.13 + y * 57.1) * 0.38;
      const value = 128 + (fibre - 0.5) * 132;
      const index = (y * TILE + x) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  grainTile = canvas;
  return canvas;
}

/** Low-frequency unevenness, the way dye soaks into stock. */
function getBlotchTile() {
  if (blotchTile) return blotchTile;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const image = ctx.createImageData(size, size);
  const { data } = image;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = 128 + (fbm(x / 26, y / 26, 91.3, 4) - 0.5) * 96;
      const index = (y * size + x) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  blotchTile = canvas;
  return canvas;
}

export type PaperOptions = {
  seed: number;
  /** 0 flat, 1 heavily fibrous. */
  intensity: number;
  /** Skip the crease pass on small areas like thumbnails. */
  creases?: boolean;
};

export function paperTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  { seed, intensity, creases = true }: PaperOptions,
) {
  if (intensity <= 0.001) return;

  const grain = ctx.createPattern(getGrainTile(), "repeat");
  const blotch = ctx.createPattern(getBlotchTile(), "repeat");
  const offsetX = Math.floor(hash(seed * 3.7) * TILE);
  const offsetY = Math.floor(hash(seed * 9.1) * TILE);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.globalCompositeOperation = "overlay";

  if (blotch) {
    blotch.setTransform(
      new DOMMatrix().translate(-offsetY, -offsetX).scale(2.6),
    );
    ctx.globalAlpha = Math.min(0.5, 0.16 + intensity * 0.3);
    ctx.fillStyle = blotch;
    ctx.fillRect(x, y, width, height);
  }

  if (grain) {
    grain.setTransform(new DOMMatrix().translate(-offsetX, -offsetY));
    ctx.globalAlpha = Math.min(0.72, 0.2 + intensity * 0.52);
    ctx.fillStyle = grain;
    ctx.fillRect(x, y, width, height);
  }

  // Loose fibres sitting on the surface.
  const fibres = Math.floor(width * height * 0.00012 * (0.4 + intensity));
  ctx.globalAlpha = 0.16 + intensity * 0.2;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < fibres; i++) {
    const fx = x + hash(seed + i * 3.19) * width;
    const fy = y + hash(seed + i * 7.83) * height;
    const length = 6 + hash(seed + i * 2.71) * 34;
    ctx.strokeStyle = hash(seed + i * 11.37) > 0.45 ? "#ffffff" : "#101010";
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + length, fy + hash(seed + i * 5.31) * 3 - 1.5);
    ctx.stroke();
  }

  if (creases) {
    ctx.globalAlpha = 0.1 + intensity * 0.12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6;
    const count = 2 + Math.floor(intensity * 4);
    for (let i = 0; i < count; i++) {
      const cx = x + hash(seed + i * 17.3) * width;
      const cy = y + hash(seed + i * 23.9) * height;
      const angle = hash(seed + i * 31.1) * Math.PI;
      const length = height * (0.2 + hash(seed + i * 13.7) * 0.5);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(
        cx + Math.cos(angle) * length * 0.5 + 18,
        cy + Math.sin(angle) * length * 0.5,
        cx + Math.cos(angle) * length,
        cy + Math.sin(angle) * length,
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

type Bitmap = HTMLCanvasElement | HTMLImageElement;

function intrinsic(source: Bitmap) {
  return "naturalWidth" in source
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/** Draws `source` cropped to fill the rect, centred — CSS `object-fit: cover`. */
export function drawFill(
  ctx: CanvasRenderingContext2D,
  source: Bitmap,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const size = intrinsic(source);
  if (!size.width || !size.height) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  const scale = Math.max(width / size.width, height / size.height);
  const drawWidth = size.width * scale;
  const drawHeight = size.height * scale;
  ctx.drawImage(
    source,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}
