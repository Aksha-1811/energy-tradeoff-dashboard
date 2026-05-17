/** =========================
 *  Helpers: stats + semantics
 *  ========================= */

import { EnergyRow, FeatureKey } from "../types/energy";

export function median(values: number[]) {
  const arr = values
    .filter(Number.isFinite)
    .slice()
    .sort((a, b) => a - b);
  if (arr.length === 0) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

// ---- Normalize backend feature keys (0..4 OR X1..X5) ----
export function normalizeFeatureKey(k: string): FeatureKey | null {
  const trimmed = k.trim();

  if (
    trimmed === "X1" ||
    trimmed === "X2" ||
    trimmed === "X3" ||
    trimmed === "X4" ||
    trimmed === "X5"
  ) {
    return trimmed;
  }

  const n = Number(trimmed);
  if (Number.isFinite(n)) {
    const map: Record<number, FeatureKey> = {
      0: "X1",
      1: "X2",
      2: "X3",
      3: "X4",
      4: "X5",
    };
    return map[n] ?? null;
  }

  return null;
}

// Histogram bins for Y
export function buildHistogram(values: number[], binCount = 12) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / binCount || 1;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * step;
    const end = start + step;
    return { start, end, count: 0 };
  });

  for (const v of values) {
    const idx = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((v - min) / step)),
    );
    bins[idx].count += 1;
  }

  const labels = bins.map((b) => `${b.start.toFixed(1)} – ${b.end.toFixed(1)}`);
  const counts = bins.map((b) => b.count);
  return { labels, counts };
}

// Efficiency curve: avg Y by X bins
export function buildEfficiencyLine(
  rows: EnergyRow[],
  xKey: FeatureKey,
  binCount = 10,
) {
  const xVals = rows.map((r) => r[xKey]);
  const min = Math.min(...xVals);
  const max = Math.max(...xVals);
  const step = (max - min) / binCount || 1;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const start = min + i * step;
    const end = start + step;
    return { start, end, sum: 0, count: 0 };
  });

  for (const r of rows) {
    const xv = r[xKey];
    const idx = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((xv - min) / step)),
    );
    bins[idx].sum += r.Y;
    bins[idx].count += 1;
  }

  const avg = bins.map((b) => (b.count ? b.sum / b.count : 0));
  return { bins, avg };
}
