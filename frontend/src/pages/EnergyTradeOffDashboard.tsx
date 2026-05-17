import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  Filler,
);

type EnergyRow = {
  X1: number; // Heat pump
  X2: number; // PV
  X3: number; // EV
  X4: number; // Washing machine
  X5: number; // Dishwasher
  Y: number; // Grid import (target)
};

type EnergyApiResponse = {
  meta: Record<string, unknown>;
  thresholds: { medianY: number };
  summary: {
    yMin: number;
    yMax: number;
    yMean: number;
    corr: Record<string, number>;
    linearModel: {
      intercept: number;
      coefficients: Record<string, number>;
      r2: number;
    };
    modelMetrics?: {
      r2: number;
      mae: number;
      rmse: number;
      nTrain: number;
      nTest: number;
    };
    featureImportance?: Record<string, number>;
    forecast?: { step: number; yHat: number }[];
  };
  rows: EnergyRow[];
  operational_summary?: {
    risk_level: string;
    peak_forecast: number;
    average_forecast: number;
    typical_zone: string;
    top_feature: string;
    recommendation: string;
  };
};

const API_BASE = "http://localhost:8004";

type FeatureKey = "X1" | "X2" | "X3" | "X4" | "X5";

const UNITS = {
  power: "W", // inputs (loads/generation) – power-like magnitude
  energy: "W", // target (grid import) – power snapshot
  count: "count",
};

const FEATURE_META: Record<FeatureKey, { label: string; unit: string }> = {
  X1: { label: "Heat Pump (X1)", unit: UNITS.power },
  X2: { label: "PV (X2)", unit: UNITS.power },
  X3: { label: "EV (X3)", unit: UNITS.power },
  X4: { label: "Washing Machine (X4)", unit: UNITS.power },
  X5: { label: "Dishwasher (X5)", unit: UNITS.power },
};

const chartTheme = {
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

function formatNum(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}
function formatInt(n: number) {
  return Number.isFinite(n) ? String(Math.round(n)) : "—";
}
function roundTick(n: number) {
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1000) return String(Math.round(n));
  if (Math.abs(n) >= 100) return String(Math.round(n));
  return n.toFixed(0);
}

function baseChartOptions(
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

/** =========================
 *  Info tooltip (ⓘ) for cards
 *  ========================= */
function InfoTip({
  title,
  children,
  align = "right",
}: {
  title: string;
  children: React.ReactNode;
  align?: "right" | "left";
}) {
  const id = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    const gap = 10;
    const width = 340;

    // default: align right edge of tooltip with button
    const left =
      align === "right"
        ? Math.max(8, Math.min(window.innerWidth - width - 8, r.right - width))
        : Math.max(8, Math.min(window.innerWidth - width - 8, r.left));

    const top = Math.min(window.innerHeight - 8, r.bottom + gap);

    setPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();

    const onScroll = () => updatePos();
    const onResize = () => updatePos();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  return (
    <>
      <div className="absolute top-3 right-2 z-20">
        <button
          ref={btnRef}
          type="button"
          aria-label="Info"
          aria-describedby={id}
          onMouseEnter={() => {
            setOpen(true);
          }}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm
          hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
          <span className="text-xs font-semibold">i</span>
        </button>
      </div>

      {open && pos
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className="fixed z-[9999] w-[340px] rounded-xl border bg-white p-3 text-left text-xs text-gray-700 shadow-lg"
              style={{ top: pos.top, left: pos.left }}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <div className="text-[11px] font-semibold text-gray-900">
                {title}
              </div>
              <div className="mt-1 leading-relaxed">{children}</div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** =========================
 *  Helpers: stats + semantics
 *  ========================= */

function median(values: number[]) {
  const arr = values
    .filter(Number.isFinite)
    .slice()
    .sort((a, b) => a - b);
  if (arr.length === 0) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

// ---- Normalize backend feature keys (0..4 OR X1..X5) ----
function normalizeFeatureKey(k: string): FeatureKey | null {
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
function buildHistogram(values: number[], binCount = 12) {
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

  const labels = bins.map((b) => `${b.start.toFixed(1)}–${b.end.toFixed(1)}`);
  const counts = bins.map((b) => b.count);
  return { labels, counts };
}

// Efficiency curve: avg Y by X bins
function buildEfficiencyLine(
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function InsightChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

const EnergyTradeoffDashboard: React.FC = () => {
  const [data, setData] = useState<EnergyApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<EnergyRow[]>([]);
  const [isInsightPanelOpen, setIsInsightPanelOpen] = useState(false);

  const [sampleRows, setSampleRows] = useState(650);
  const [seed, setSeed] = useState(225451065);

  const [xFeature, setXFeature] = useState<FeatureKey>("X1"); // default: Heat Pump
  const svgRef = useRef<SVGSVGElement | null>(null);
  const behaviorChartRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const getPointId = (point: EnergyRow) =>
    `${point.X1}-${point.X2}-${point.X3}-${point.X4}-${point.X5}-${point.Y}`;

  const addInsightPoint = (point: EnergyRow) => {
    setSelectedPoints((prev) => {
      const exists = prev.some((p) => getPointId(p) === getPointId(point));
      if (exists) return prev;
      return [...prev, point];
    });

    setIsInsightPanelOpen(true);
  };

  const removeInsightPoint = (point: EnergyRow) => {
    setSelectedPoints((prev) =>
      prev.filter((p) => getPointId(p) !== getPointId(point)),
    );
  };

  const clearInsightPoints = () => {
    setSelectedPoints([]);
  };

  async function loadDefault() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = `${API_BASE}/energy/tradeoff?seed=${seed}&sample_rows=${sampleRows}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      const json = (await res.json()) as EnergyApiResponse;
      setData(json);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDefault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const xMeta = FEATURE_META[xFeature];

  const previewRows = useMemo(
    () => (data ? data.rows.slice(0, 6) : []),
    [data],
  );

  const applianceMedians = useMemo(() => {
    if (!data) return null;
    const m = (k: FeatureKey) => median(data.rows.map((r) => r[k]));
    return {
      heatPump: m("X1"),
      pv: m("X2"),
      ev: m("X3"),
      washer: m("X4"),
      dishwasher: m("X5"),
    };
  }, [data]);

  const histogram = useMemo(() => {
    if (!data) return null;
    return buildHistogram(
      data.rows.map((r) => r.Y),
      12,
    );
  }, [data]);

  const efficiency = useMemo(() => {
    if (!data) return null;
    const { bins, avg } = buildEfficiencyLine(data.rows, xFeature, 10);
    const labels = bins.map(
      (b) => `${b.start.toFixed(1)}–${b.end.toFixed(1)}${xMeta.unit}`,
    );
    return { labels, avg };
  }, [data, xFeature, xMeta.unit]);

  const featureImportance = useMemo(() => {
    const fi = data?.summary.featureImportance;
    if (!fi) return null;

    const entries = Object.entries(fi)
      .map(([k, v]) => [normalizeFeatureKey(k), v] as const)
      .filter(([k, v]) => k && Number.isFinite(v))
      .sort((a, b) => (b[1] as number) - (a[1] as number));

    const labels = entries.map(([k]) => FEATURE_META[k as FeatureKey].label);
    const values = entries.map(([, v]) => v as number);

    return { labels, values };
  }, [data]);

  const forecast = useMemo(() => {
    const fc = data?.summary.forecast;
    if (!fc || fc.length === 0) return null;
    return {
      labels: fc.map((p) => `${p.step}`),
      values: fc.map((p) => p.yHat),
    };
  }, [data]);

  const modelMetrics = data?.summary.modelMetrics ?? null;
  const operationalSummary = useMemo(() => {
    if (!forecast || !histogram || !featureImportance) return null;

    const peakForecast = Math.max(...forecast.values);
    const avgForecast =
      forecast.values.reduce((sum, value) => sum + value, 0) /
      forecast.values.length;

    const maxCount = Math.max(...histogram.counts);
    const typicalZoneIndex = histogram.counts.indexOf(maxCount);
    const typicalZone = histogram.labels[typicalZoneIndex];

    const topFeature = featureImportance.labels[0] ?? "main energy driver";

    const riskLevel =
      peakForecast > avgForecast * 1.08
        ? "Elevated"
        : peakForecast > avgForecast * 1.03
          ? "Moderate"
          : "Stable";

    return {
      peakForecast,
      avgForecast,
      typicalZone,
      topFeature,
      riskLevel,
    };
  }, [forecast, histogram, featureImportance]);

  // D3 scatter
  const [showChartGuide, setShowChartGuide] = useState(true);

  useEffect(() => {
    if (!behaviorChartRef.current) return;

    let repeatInterval: ReturnType<typeof setInterval>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const showGuide = () => {
      setShowChartGuide(true);

      hideTimer = setTimeout(() => {
        setShowChartGuide(false);
      }, 3000);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          showGuide();

          repeatInterval = setInterval(() => {
            showGuide();
          }, 120000);
        } else {
          setShowChartGuide(false);
          clearInterval(repeatInterval);
          clearTimeout(hideTimer);
        }
      },
      {
        threshold: 0.45,
      },
    );

    observer.observe(behaviorChartRef.current);

    return () => {
      observer.disconnect();
      clearInterval(repeatInterval);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const rows = data.rows;
    const medianY = data.thresholds.medianY;

    const width = 820;
    const height = 420;
    const margin = { top: 24, right: 24, bottom: 56, left: 72 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(rows, (d) => d[xFeature]) as [number, number])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(rows, (d) => d.Y) as [number, number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => roundTick(Number(d))),
      );

    const yAxis = svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickFormat((d) => roundTick(Number(d))),
      );

    xAxis
      .selectAll("text")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .style("fill", "#6B7280");

    yAxis
      .selectAll("text")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .style("fill", "#6B7280");

    xAxis.selectAll("path,line").style("stroke", "#9CA3AF");

    yAxis.selectAll("path,line").style("stroke", "#9CA3AF");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .attr("fill", "#374151")
      .text(`${xMeta.label} (${xMeta.unit})`);

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .attr("fill", "#374151")
      .text(`Grid Import (Y) (${UNITS.energy})`);

    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(medianY))
      .attr("y2", y(medianY))
      .attr("stroke", "#9CA3AF")
      .attr("stroke-dasharray", "6 6")
      .attr("opacity", 0.9);

    svg
      .append("text")
      .attr("x", width - margin.right)
      .attr("y", y(medianY) - 8)
      .attr("text-anchor", "end")
      .attr("font-size", 18)
      .attr("fill", "#6B7280")
      .text("Efficiency boundary (median Y)");

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("border", "1px solid #E5E7EB")
      .style("border-radius", "10px")
      .style("padding", "8px 10px")
      .style("font-size", "12px")
      .style("color", "#111827")
      .style("box-shadow", "0 8px 24px rgba(0,0,0,0.08)")
      .style("opacity", 0);

    const move = (event: MouseEvent) => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    };

    const show = (event: MouseEvent, d: EnergyRow) => {
      tooltip.style("opacity", 1).html(
        `<div style="font-weight:600;margin-bottom:4px;">Observation</div>
           <div>${xMeta.label}: ${formatNum(d[xFeature])} ${xMeta.unit}</div>
           <div>Grid import (Y): ${formatNum(d.Y)} ${UNITS.energy}</div>
           <div>Zone: ${d.Y >= medianY ? "High" : "Low"}</div>`,
      );
      move(event);
    };

    const hide = () => tooltip.style("opacity", 0);

    svg
      .append("g")
      .selectAll("circle")
      .data(rows)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d[xFeature]))
      .attr("cy", (d) => y(d.Y))
      .attr("r", 3.2)
      .attr("fill", (d) => (d.Y >= medianY ? "#EF4444" : "#10B981"))
      .attr("opacity", 0.75)
      .style("cursor", "pointer")
      .attr("stroke", (d) =>
        selectedPoints.some((p) => getPointId(p) === getPointId(d))
          ? "#111827"
          : "none",
      )
      .attr("stroke-width", (d) =>
        selectedPoints.some((p) => getPointId(p) === getPointId(d)) ? 2 : 0,
      )
      .attr("r", (d) =>
        selectedPoints.some((p) => getPointId(p) === getPointId(d)) ? 6.5 : 4.2,
      )
      .on("click", function (event, d) {
        addInsightPoint(d);
      })
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr("r", 7.5)
          .attr("opacity", 1);

        show(event as any, d);
      })
      .on("mousemove", function (event) {
        move(event as any);
      })
      .on("mouseleave", function (event, d) {
        const isSelected = selectedPoints.some(
          (p) => getPointId(p) === getPointId(d),
        );

        d3.select(this)
          .transition()
          .duration(120)
          .attr("r", isSelected ? 6.5 : 4.2)
          .attr("opacity", 0.8);

        hide();
      });

    return () => {
      tooltip.remove();
    };
  }, [data, xFeature, xMeta.label, xMeta.unit, selectedPoints]);

  const featureOptions = useMemo(() => {
    const keys: FeatureKey[] = ["X1", "X2", "X3", "X4", "X5"];
    return keys.map((k) => ({
      key: k,
      text: `${FEATURE_META[k].label} (${FEATURE_META[k].unit})`,
    }));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div
        className="absolute top-4 left-4 bg-gray-200 rounded-full p-3 shadow-lg cursor-pointer hover:bg-purple-600 transition"
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
      >
        <AiOutlineArrowLeft className="text-xl text-gray-700" />
      </div>

      {/* HEADER */}
      <div className="pt-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#06050B] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-500/25 blur-[95px]" />
            <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:18px_18px]" />
          </div>

          <div className="relative p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* LEFT */}
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)]" />
                  AI Card
                </div>

                <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  Building{" "}
                  <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-purple-200 bg-clip-text text-transparent">
                    Energy Intelligence
                  </span>
                </h1>

                <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
                  Dataset meaning (from OPSD mapping):
                  <br />
                  <span className="text-white/85">
                    X1 Heat Pump, X2 PV, X3 EV, X4 Washing Machine, X5
                    Dishwasher.
                  </span>
                  <br />
                  <span className="text-white/85">
                    Y is Grid Import (target).
                  </span>
                </p>
              </div>

              {/* Controls */}
              <div className="w-full lg:w-[380px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">
                      Analysis Controls
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-xs text-white/60">
                      <span className="block mb-1">Sample rows</span>
                      <input
                        type="number"
                        value={sampleRows}
                        onChange={(e) => setSampleRows(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none
                        focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </label>

                    <label className="text-xs text-white/60">
                      <span className="block mb-1">Seed</span>
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none
                        focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-white/60 w-full">
                      <span className="block mb-1">X-axis Feature</span>
                      <div className="relative w-full">
                        <select
                          value={xFeature}
                          onChange={(e) =>
                            setXFeature(e.target.value as FeatureKey)
                          }
                          className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/20"
                        >
                          {featureOptions.map((opt) => (
                            <option
                              key={opt.key}
                              value={opt.key}
                              className="bg-[#0B0712] text-white"
                            >
                              {opt.text}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white">
                          ▼
                        </span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={loadDefault}
                    disabled={loading}
                    className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white
                    bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600
                    shadow-[0_0_28px_rgba(168,85,247,0.45)]
                    hover:shadow-[0_0_36px_rgba(236,72,153,0.45)]
                    transition-all duration-300 disabled:opacity-60"
                  >
                    {loading ? "Running..." : "Run Analytics"}
                  </button>

                  {errorMsg && (
                    <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                      {errorMsg}
                      <div className="mt-1 text-xs text-red-200/80">
                        Check backend at {API_BASE}.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Raw rows */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/85">
              <div className="text-sm font-semibold">Sample rows</div>
              <div className="mt-1 text-xs text-white/60">
                These are the first few rows returned by the backend.
              </div>

              {!data ? (
                <div className="mt-3 text-sm text-white/60">
                  Load data to preview rows.
                </div>
              ) : (
                <div className="mt-3 overflow-auto rounded-xl border border-white/10">
                  <table className="min-w-[820px] w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="text-left text-xs text-white/60">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Heat Pump (X1)</th>
                        <th className="px-3 py-2">PV (X2)</th>
                        <th className="px-3 py-2">EV (X3)</th>
                        <th className="px-3 py-2">Washer (X4)</th>
                        <th className="px-3 py-2">Dishwasher (X5)</th>
                        <th className="px-3 py-2">Grid Import (Y)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          <td className="px-3 py-2 text-white/60">{idx + 1}</td>
                          <td className="px-3 py-2">{formatNum(r.X1)}</td>
                          <td className="px-3 py-2">{formatNum(r.X2)}</td>
                          <td className="px-3 py-2">{formatNum(r.X3)}</td>
                          <td className="px-3 py-2">{formatNum(r.X4)}</td>
                          <td className="px-3 py-2">{formatNum(r.X5)}</td>
                          <td className="px-3 py-2 font-semibold text-white">
                            {formatNum(r.Y)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <Section
          title="System Status"
          subtitle="Instant indicators of current energy behavior and predictability"
        >
          {data && applianceMedians ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <InsightChip
                label="Dishwasher median (X5)"
                value={
                  applianceMedians.dishwasher == null
                    ? "—"
                    : `${formatNum(applianceMedians.dishwasher)} ${UNITS.power}`
                }
                hint="Typical dishwasher load level."
              />
              <InsightChip
                label="Heat pump median (X1)"
                value={
                  applianceMedians.heatPump == null
                    ? "—"
                    : `${formatNum(applianceMedians.heatPump)} ${UNITS.power}`
                }
                hint="Typical heat pump load."
              />
              <InsightChip
                label={`Current Load Level (Mean Y, ${UNITS.energy})`}
                value={`${formatNum(data.summary.yMean)} ${UNITS.energy}`}
                hint="Average grid import across sampled observations."
              />
              <InsightChip
                label="System Predictability (Linear R²)"
                value={formatNum(data.summary.linearModel.r2)}
                hint="How well a simple linear model explains Y (higher is better)."
              />
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500">
              Run analytics to view system status.
            </div>
          )}
        </Section>

        {/* BEHAVIOR */}
        <Section
          title="AI Behavioral Analysis"
          subtitle="How operating conditions influence grid import"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div
              ref={behaviorChartRef}
              className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible"
            >
              <InfoTip title="Response Map (Scatter + Median Threshold)">
                <div className="space-y-2">
                  <div>
                    Each dot is one observation: (X, Y). We plot{" "}
                    <b>{xMeta.label}</b> on X-axis and <b>Grid Import (Y)</b> on
                    Y-axis.
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    The dashed line is <b>median(Y)</b>, a robust threshold:
                    half the points lie above, half below.
                  </div>
                  <div>
                    Color = “zone” relative to median(Y): above = higher grid
                    import (red), below = lower (green). This is a simple
                    operational split for analysis.
                  </div>
                </div>
              </InfoTip>
              {showChartGuide && (
                <div className="pointer-events-none absolute left-[58%] top-[40%] z-30 flex items-center gap-2">
                  <div className="animate-ping absolute h-8 w-8 rounded-full bg-violet-400/40" />

                  <div className="animate-bounce text-xl">👆</div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Response Map (Scatter)
                </h3>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border bg-gray-50">
                <svg ref={svgRef} className="w-full" />
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Red indicates above-boundary usage.
              </p>
            </div>

            <div className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible">
              <InfoTip title="Efficiency Curve (Binning + Average)">
                <div className="space-y-2">
                  <div>
                    We can’t show 10k+ points clearly, so we <b>bin</b> the X
                    range into K intervals.
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    For each bin i: <b>avgYᵢ = (ΣY)/count</b>
                  </div>
                  <div>
                    The line shows how average grid import changes as{" "}
                    <b>{xMeta.label}</b> increases.
                  </div>
                </div>
              </InfoTip>

              <h3 className="text-sm font-semibold">
                Efficiency Curve (Avg Y by {xMeta.label})
              </h3>
              <div className="mt-3 h-[260px]">
                {efficiency ? (
                  <Line
                    data={{
                      labels: efficiency.labels,
                      datasets: [
                        {
                          label: `Average Y (${UNITS.energy})`,
                          data: efficiency.avg,
                          tension: 0.25,
                          pointRadius: 3,
                          borderColor: chartTheme.accent,
                          pointBackgroundColor: chartTheme.accent,
                          backgroundColor: chartTheme.accentSoft2,
                          fill: true,
                        },
                      ],
                    }}
                    options={baseChartOptions(
                      `${xMeta.label} bins (${xMeta.unit})`,
                      `Avg Y (${UNITS.energy})`,
                    )}
                  />
                ) : (
                  <div className="text-sm text-gray-500">
                    Load data to view chart.
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-600">
                Smoothed view: Average Grid Import ({UNITS.energy}) across
                binned {xMeta.label}.
              </div>
            </div>
          </div>
        </Section>

        {/* FORECAST + RISK */}
        <Section
          title="AI Forecasting & Risk Estimation"
          subtitle="Validated prediction metrics + short-horizon forecast + distribution risk"
        >
          <div className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible">
            <InfoTip title="Model Quality (Train/Test + Metrics)">
              <div className="space-y-2">
                <div>
                  We split the sampled dataset into train/test (e.g., 75/25) and
                  train a <b>Ridge Regression</b>.
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  Objective: <b>min</b> ||y − Xβ||² + <b>α</b>||β||²
                </div>
                <div>
                  Metrics:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>
                      <b>R²</b>: how much variance is explained
                    </li>
                    <li>
                      <b>MAE</b>: average absolute error
                    </li>
                    <li>
                      <b>RMSE</b>: penalizes larger errors more
                    </li>
                  </ul>
                </div>
              </div>
            </InfoTip>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Predictive Model Quality
                </div>
                <div className="text-xs text-gray-500">
                  Ridge regression with train/test split.
                </div>
              </div>

              {modelMetrics ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mr-20">
                  <div className="rounded-xl border bg-gray-50 px-3 py-2">
                    <div className="text-[11px] text-gray-500">Test R²</div>
                    <div className="text-sm font-semibold">
                      {formatNum(modelMetrics.r2)}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2">
                    <div className="text-[11px] text-gray-500">
                      MAE ({UNITS.energy})
                    </div>
                    <div className="text-sm font-semibold">
                      {formatNum(modelMetrics.mae)}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2">
                    <div className="text-[11px] text-gray-500">
                      RMSE ({UNITS.energy})
                    </div>
                    <div className="text-sm font-semibold">
                      {formatNum(modelMetrics.rmse)}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2">
                    <div className="text-[11px] text-gray-500">Train N</div>
                    <div className="text-sm font-semibold">
                      {formatInt(modelMetrics.nTrain)}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2">
                    <div className="text-[11px] text-gray-500">Test N</div>
                    <div className="text-sm font-semibold">
                      {formatInt(modelMetrics.nTest)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  No model metrics returned (summary.modelMetrics).
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible">
              <InfoTip title="Short-Horizon Forecast (Demo Forecast)">
                <div className="space-y-2">
                  <div>
                    This chart shows <b>24 predicted steps</b> of Y (grid
                    import) using the trained Ridge model.
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    Ŷ = β0 + β1X1 + β2X2 + β3X3 + β4X4 + β5X5
                  </div>
                  <div>
                    In this demo, steps are generated by taking the last feature
                    vector and applying small perturbations, then predicting Ŷ.
                    (Not a full time-series model.)
                  </div>
                </div>
              </InfoTip>

              <h3 className="text-sm font-semibold">Short-Horizon Forecast</h3>
              <div className="mt-3 h-[260px]">
                {forecast ? (
                  <Line
                    data={{
                      labels: forecast.labels,
                      datasets: [
                        {
                          label: `Predicted Y (Ŷ, ${UNITS.energy})`,
                          data: forecast.values,
                          tension: 0.25,
                          pointRadius: 2,
                          borderColor: chartTheme.forecast,
                          pointBackgroundColor: chartTheme.forecast,
                          backgroundColor: chartTheme.forecastSoft,
                          fill: true,
                        },
                      ],
                    }}
                    options={baseChartOptions(
                      "Step",
                      `Predicted Y (${UNITS.energy})`,
                    )}
                  />
                ) : (
                  <div className="text-sm text-gray-500">
                    No forecast returned (summary.forecast).
                  </div>
                )}
              </div>
            </div>

            <div className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible">
              <InfoTip title="Risk Profile (Histogram of Y)">
                <div className="space-y-2">
                  <div>
                    A histogram summarizes the <b>distribution</b> of Y. We
                    split [min(Y), max(Y)] into K bins.
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    count(bin i) = number of samples where aᵢ ≤ Y &lt; bᵢ
                  </div>
                  <div>
                    Tall bars = typical operating range. Sparse/high bins can
                    indicate rare peak import (risk spikes).
                  </div>
                </div>
              </InfoTip>

              <h3 className="text-sm font-semibold">
                Consumption Risk Profile
              </h3>
              <div className="mt-3 h-[260px]">
                {histogram ? (
                  <Bar
                    data={{
                      labels: histogram.labels,
                      datasets: [
                        {
                          label: "Frequency",
                          data: histogram.counts,
                          backgroundColor: chartTheme.accentSoft,
                          borderColor: chartTheme.accent,
                          borderWidth: 1,
                          borderRadius: 10,
                        },
                      ],
                    }}
                    options={baseChartOptions(
                      `Y bins (${UNITS.energy})`,
                      `Frequency (${UNITS.count})`,
                    )}
                  />
                ) : (
                  <div className="text-sm text-gray-500">
                    Load data to view chart.
                  </div>
                )}
              </div>
            </div>
          </div>

          {operationalSummary && (
            <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    AI Operational Summary
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    System outlook: {operationalSummary.riskLevel} demand risk
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                    The model forecasts future grid import, identifies the most
                    common operating range, and highlights the strongest energy
                    driver for decision support.
                  </p>
                </div>

                <span className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">
                  Decision Insight
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-slate-500">Peak forecast</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatNum(operationalSummary.peakForecast)} {UNITS.energy}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Highest predicted grid import in the short horizon.
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Typical operating zone
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {operationalSummary.typicalZone}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Most frequent grid import range in the sampled data.
                  </p>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <p className="text-xs text-slate-500">Main influence</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {operationalSummary.topFeature}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Strongest feature based on model importance.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-slate-700">
                <span className="font-semibold text-violet-700">
                  Recommendation:
                </span>{" "}
                Monitor high-load periods and shift flexible appliance usage
                when forecasted grid import is high. This helps reduce peak
                consumption and improves energy efficiency.
              </div>
            </div>
          )}
        </Section>

        {/* IMPORTANCE */}
        <Section
          title="Control Influence Map"
          subtitle="Feature ranking used to prioritize optimization and control decisions"
        >
          <div className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible">
            <InfoTip title="Feature Importance (|Ridge Coef|)">
              <div className="space-y-2">
                <div>
                  We use absolute Ridge coefficients as a simple importance
                  proxy:
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  Importance(Xᵢ) = <b>|βᵢ|</b>
                </div>
                <div>
                  Bigger bar = stronger influence on predicted Y (given
                  standardized inputs). It’s a lightweight “control priority”
                  indicator.
                </div>
              </div>
            </InfoTip>

            <h3 className="text-sm font-semibold">Feature Importance</h3>
            <div className="mt-3 h-[300px]">
              {featureImportance ? (
                <Bar
                  data={{
                    labels: featureImportance.labels,
                    datasets: [
                      {
                        label: "Importance (|coef|)",
                        data: featureImportance.values,
                        backgroundColor: chartTheme.cyanSoft,
                        borderColor: chartTheme.cyan,
                        borderWidth: 1,
                        borderRadius: 10,
                      },
                    ],
                  }}
                  options={baseChartOptions("Feature", "Relative importance")}
                />
              ) : (
                <div className="text-sm text-gray-500">
                  No feature importance returned (summary.featureImportance).
                </div>
              )}
            </div>
          </div>
        </Section>
        {selectedPoints.length > 0 && !isInsightPanelOpen && (
          <button
            type="button"
            onClick={() => setIsInsightPanelOpen(true)}
            className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-2xl bg-violet-600 px-3 py-5 text-white shadow-xl transition hover:bg-violet-700"
            aria-label="Open insight panel"
          >
            ←
          </button>
        )}

        {isInsightPanelOpen && selectedPoints.length > 0 && data && (
          <aside className="fixed right-0 top-0 z-50 flex h-screen w-[380px] flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Insight Panel
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedPoints.length} selected operating point
                  {selectedPoints.length > 1 ? "s" : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsInsightPanelOpen(false)}
                className="rounded-full px-3 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close insight panel"
              >
                →
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <button
                type="button"
                onClick={clearInsightPoints}
                className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                Clear all insights
              </button>

              {selectedPoints.map((point, index) => {
                const isHigh = point.Y >= data.thresholds.medianY;

                return (
                  <div
                    key={getPointId(point)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                        ⚡ Operating Point {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeInsightPoint(point)}
                        className="rounded-full px-2 text-sm font-bold text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        aria-label={`Remove operating point ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-2 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold text-slate-900">
                          {xMeta.label}:
                        </span>{" "}
                        {formatNum(point[xFeature])} {xMeta.unit}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-900">
                          Grid Import:
                        </span>{" "}
                        {formatNum(point.Y)} {UNITS.energy}
                      </p>

                      <p>
                        <span className="font-semibold text-slate-900">
                          Status:
                        </span>{" "}
                        {isHigh ? (
                          <span className="font-semibold text-red-600">
                            High Consumption
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600">
                            Efficient Range
                          </span>
                        )}
                      </p>

                      <div className="rounded-xl bg-violet-50 p-3 text-xs leading-relaxed">
                        <span className="font-semibold text-violet-700">
                          Recommendation:
                        </span>{" "}
                        {isHigh
                          ? "Review heat pump load or shift usage window."
                          : "Current operating point is within efficient range."}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default EnergyTradeoffDashboard;
