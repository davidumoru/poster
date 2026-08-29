import type { Palette } from "@/lib/poster/types";

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function rgbToHex([r, g, b]: number[]) {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function luminance([r, g, b]: number[]) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function colorDistance(a: number[], b: number[]) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

export function mix(a: string, b: string, t: number) {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex(from.map((channel, i) => channel + (to[i] - channel) * t));
}

export function inkOn(background: string, light = "#faf8f3", dark = "#141210") {
  return luminance(hexToRgb(background)) > 145 ? dark : light;
}

export function extractPalette(
  image: HTMLImageElement,
  name: string,
  fallback: Palette,
): Palette {
  const size = 112;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;

  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

  const pixels = ctx.getImageData(0, 0, size, size).data;
  const samples: Rgb[] = [];

  for (let i = 0; i < pixels.length; i += 16) {
    if (pixels[i + 3] < 180) continue;

    const rgb: Rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const light = luminance(rgb);
    const chroma = Math.max(...rgb) - Math.min(...rgb);

    // Blown-out white is the scan, not the artwork.
    if (light > 244 && chroma < 18) continue;
    samples.push(rgb);
  }

  if (samples.length < 8) return { ...fallback, name };

  const sorted = [...samples].sort((a, b) => luminance(a) - luminance(b));
  let centers: number[][] = [0.06, 0.28, 0.5, 0.72, 0.94].map(
    (position) => sorted[Math.floor(position * (sorted.length - 1))],
  );

  for (let pass = 0; pass < 12; pass++) {
    const groups = centers.map(() => ({ total: [0, 0, 0], count: 0 }));

    for (const sample of samples) {
      let best = 0;
      let bestDistance = Infinity;
      for (let index = 0; index < centers.length; index++) {
        const distance = colorDistance(sample, centers[index]);
        if (distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      }
      groups[best].total[0] += sample[0];
      groups[best].total[1] += sample[1];
      groups[best].total[2] += sample[2];
      groups[best].count += 1;
    }

    centers = centers.map((center, index) => {
      const group = groups[index];
      if (!group.count) return center;
      return group.total.map((value) => value / group.count);
    });
  }

  const colors = centers
    .sort((a, b) => luminance(b) - luminance(a))
    .map(rgbToHex)
    .filter((color, index, list) => list.indexOf(color) === index);

  while (colors.length < 5) colors.push(fallback.colors[colors.length]);

  return { name, colors };
}

export function buildRamp(colors: string[], steps: number) {
  const count = Math.max(2, Math.min(24, Math.round(steps)));
  if (colors.length === 0)
    return Array.from({ length: count }, () => "#000000");
  if (colors.length === 1)
    return Array.from({ length: count }, () => colors[0]);

  const ordered = [...colors].sort(
    (a, b) => luminance(hexToRgb(b)) - luminance(hexToRgb(a)),
  );

  if (count <= ordered.length) {
    return Array.from(
      { length: count },
      (_, index) =>
        ordered[Math.round((index / (count - 1)) * (ordered.length - 1))],
    );
  }

  return Array.from({ length: count }, (_, index) => {
    const position = (index / (count - 1)) * (ordered.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(ordered.length - 1, lower + 1);
    return mix(ordered[lower], ordered[upper], position - lower);
  });
}
