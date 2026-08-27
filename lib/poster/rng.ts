/**
 * Deterministic noise and randomness. Everything the generator draws is a pure
 * function of `seed`, so the same seed always prints the same sheet.
 */

/**
 * Hash a number into [0, 1). Integer mixing rather than the usual
 * `sin(n) * 43758.5` — the field renderer calls this millions of times per
 * frame, and `Math.sin` is an order of magnitude slower.
 */
export function hash(n: number) {
  let x = (n * 65536) | 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d);
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}

export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Bilinear value noise. Cheap, and smooth enough once fbm stacks it. */
export function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi * 127.1 + yi * 311.7 + seed * 17.13);
  const b = hash((xi + 1) * 127.1 + yi * 311.7 + seed * 17.13);
  const c = hash(xi * 127.1 + (yi + 1) * 311.7 + seed * 17.13);
  const d = hash((xi + 1) * 127.1 + (yi + 1) * 311.7 + seed * 17.13);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

/** Fractal brownian motion over `valueNoise`. Returns roughly [0, 1]. */
export function fbm(x: number, y: number, seed: number, octaves = 5) {
  let value = 0;
  let amplitude = 0.56;
  let frequency = 1;
  let total = 0;

  for (let i = 0; i < octaves; i++) {
    value +=
      valueNoise(x * frequency, y * frequency, seed + i * 29.7) * amplitude;
    total += amplitude;
    amplitude *= 0.52;
    frequency *= 2.05;
  }

  return value / total;
}

/** Worley-ish F2 - F1 distance field, for cellular plates. */
export function cellField(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let nearest = Infinity;
  let second = Infinity;

  for (let gy = -1; gy <= 1; gy++) {
    for (let gx = -1; gx <= 1; gx++) {
      const cx = xi + gx + hash((xi + gx) * 41.7 + (yi + gy) * 19.3 + seed);
      const cy =
        yi + gy + hash((xi + gx) * 12.9 + (yi + gy) * 59.1 + seed * 1.3);
      const dx = x - cx;
      const dy = y - cy;
      const distance = dx * dx + dy * dy;

      if (distance < nearest) {
        second = nearest;
        nearest = distance;
      } else if (distance < second) {
        second = distance;
      }
    }
  }

  return Math.sqrt(second) - Math.sqrt(nearest);
}

/** Snap a [0, 1) value onto one of `bands` steps. */
export function quantize(value: number, bands: number) {
  return clamp(Math.floor(value * bands), 0, bands - 1);
}

export type Rng = {
  /** Next float in [0, 1). */
  next: () => number;
  range: (min: number, max: number) => number;
  int: (min: number, maxExclusive: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
  /** `weights.length` values in [0,1] summing to 1, each at least `min`. */
  weights: (count: number, min?: number) => number[];
};

/** mulberry32 — small, fast, and good enough for layout decisions. */
export function createRng(seed: number): Rng {
  let state = (Math.floor(Math.abs(seed)) || 1) >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const range = (min: number, max: number) => min + next() * (max - min);
  const int = (min: number, maxExclusive: number) =>
    Math.floor(range(min, maxExclusive));

  const shuffle = <T>(items: readonly T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const weights = (count: number, min = 0.08) => {
    const raw = Array.from({ length: count }, () => min + next());
    const total = raw.reduce((sum, value) => sum + value, 0);
    return raw.map((value) => value / total);
  };

  return {
    next,
    range,
    int,
    chance: (probability) => next() < probability,
    pick: (items) => items[int(0, items.length)],
    shuffle,
    weights,
  };
}
