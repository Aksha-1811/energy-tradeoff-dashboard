export function formatNum(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

export function formatInt(n: number) {
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}

export function roundTick(n: number) {
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1000) return String(Math.round(n));
  if (Math.abs(n) >= 100) return String(Math.round(n));
  return n.toFixed(0);
}
