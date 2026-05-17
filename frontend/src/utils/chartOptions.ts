import { roundTick } from "./formatters";

export const chartTheme = {
  accent: "#A855F7",
  accentSoft: "rgba(168,85,247,0.25)",
  accentSoft2: "rgba(168,85,247,0.15)",
  forecast: "#EC4899",
  forecastSoft: "rgba(236,72,153,0.16)",
  cyan: "rgba(34,211,238,0.9)",
  cyanSoft: "rgba(34,211,238,0.22)",
  text: "#111827",
  muted: "#6B7280",
  grid: "rgba(17,24,39,0.08)",
};

export function baseChartOptions(
  titleX: string,
  titleY: string,
  opts?: {
    yTickFormatter?: (v: number) => string;
    xTickFormatter?: (v: any) => string;
  },
) {
  return {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: false },
      title: { display: false, text: "" },
      tooltip: {
        backgroundColor: "rgba(17,24,39,0.95)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: { display: true, text: titleX, color: chartTheme.muted },
        ticks: {
          color: chartTheme.muted,
          font: { size: 10 },
          callback: function (value: any): string {
            // @ts-expect-error - Chart.js runtime provides this
            const label = this.getLabelForValue
              ? // @ts-expect-error - Chart.js runtime provides this
                this.getLabelForValue(value)
              : value;
            return opts?.xTickFormatter
              ? opts.xTickFormatter(label)
              : String(label);
          },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
        },
        grid: { color: chartTheme.grid },
      },
      y: {
        title: { display: true, text: titleY, color: chartTheme.muted },
        ticks: {
          color: chartTheme.muted,
          font: { size: 10 },
          callback: (val: any) => {
            const n = Number(val);
            if (!Number.isFinite(n)) return String(val);
            return opts?.yTickFormatter ? opts.yTickFormatter(n) : roundTick(n);
          },
        },
        grid: { color: chartTheme.grid },
      },
    },
  };
}
