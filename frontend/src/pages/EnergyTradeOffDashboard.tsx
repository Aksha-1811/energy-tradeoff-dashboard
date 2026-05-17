import { useMemo, useRef, useState } from "react";
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
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { EnergyRow, FeatureKey } from "../types/energy";
import { FEATURE_META } from "../constants/energy";
import {
  buildEfficiencyLine,
  buildHistogram,
  normalizeFeatureKey,
} from "../utils/analyticsHelpers";
import { useEnergyData } from "../hooks/useEnergyData";
import { useChartGuide } from "../hooks/useChartGuide";
import { useScatterPlot } from "../hooks/useScatterPlot";
import EnergyHero from "../components/energy/EnergyHero";
import BehaviorAnalysis from "../components/energy/BehaviorAnalysis";
import { ForecastRiskSection } from "../components/energy/ForecastRiskSection";
import { ControlInfluenceMap } from "../components/energy/FeatureImportanceCard";
import { InsightPanel } from "../components/energy/InsightPanel";

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

const EnergyTradeoffDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [selectedPoints, setSelectedPoints] = useState<EnergyRow[]>([]);
  const [isInsightPanelOpen, setIsInsightPanelOpen] = useState(false);
  const [sampleRows, setSampleRows] = useState(650);
  const [seed, setSeed] = useState(225451065);
  const [xFeature, setXFeature] = useState<FeatureKey>("X1");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const behaviorChartRef = useRef<HTMLDivElement | null>(null);

  const xMeta = FEATURE_META[xFeature];
  const { data, loading, errorMsg, loadData } = useEnergyData(sampleRows, seed);

  const getPointId = (point: EnergyRow) =>
    `${point.X1}-${point.X2}-${point.X3}-${point.X4}-${point.X5}-${point.Y}`;

  const addInsightPoint = (point: EnergyRow) => {
    setSelectedPoints((prev) => {
      const exists = prev.some((p) => getPointId(p) === getPointId(point));
      return exists ? prev : [...prev, point];
    });
    setIsInsightPanelOpen(true);
  };

  const removeInsightPoint = (point: EnergyRow) => {
    setSelectedPoints((prev) =>
      prev.filter((p) => getPointId(p) !== getPointId(point)),
    );
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const previewRows = useMemo(
    () => (data ? data.rows.slice(0, 6) : []),
    [data],
  );

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
      (b) => `${b.start.toFixed(1)} – ${b.end.toFixed(1)}${xMeta.unit}`,
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
    return {
      labels: entries.map(([k]) => FEATURE_META[k as FeatureKey].label),
      values: entries.map(([, v]) => v as number),
    };
  }, [data]);

  const operationalSummary = useMemo(() => {
    if (!data?.operational_summary) return null;
    const op = data.operational_summary;
    return {
      riskLevel: op.risk_level,
      peakForecast: op.peak_forecast,
      averageForecast: op.average_forecast,
      typicalZone: op.typical_zone,
      topFeature: op.top_feature,
      recommendation: op.recommendation,
    };
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

  const featureOptions = useMemo(() => {
    const keys: FeatureKey[] = ["X1", "X2", "X3", "X4", "X5"];
    return keys.map((k) => ({
      key: k,
      text: `${FEATURE_META[k].label} (${FEATURE_META[k].unit})`,
    }));
  }, []);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const showChartGuide = useChartGuide(behaviorChartRef);
  useScatterPlot({
    data,
    svgRef,
    xFeature,
    xMeta,
    selectedPoints,
    addInsightPoint,
    getPointId,
  });

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

      <div className="pt-6">
        <EnergyHero
          data={data}
          previewRows={previewRows}
          sampleRows={sampleRows}
          setSampleRows={setSampleRows}
          seed={seed}
          setSeed={setSeed}
          xFeature={xFeature}
          setXFeature={setXFeature}
          featureOptions={featureOptions}
          loadData={loadData}
          loading={loading}
          errorMsg={errorMsg}
        />

        <BehaviorAnalysis
          data={data}
          svgRef={svgRef}
          behaviorChartRef={behaviorChartRef}
          xMeta={xMeta}
          showChartGuide={showChartGuide}
          efficiency={efficiency}
        />

        <ForecastRiskSection
          modelMetrics={modelMetrics}
          forecast={forecast}
          histogram={histogram}
          operationalSummary={operationalSummary}
        />

        {featureImportance && (
          <ControlInfluenceMap
            labels={featureImportance.labels}
            values={featureImportance.values}
          />
        )}

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
          <InsightPanel
            selectedPoints={selectedPoints}
            xFeature={xFeature}
            xMeta={xMeta}
            medianY={data.thresholds.medianY}
            getPointId={getPointId}
            onClose={() => setIsInsightPanelOpen(false)}
            onRemove={removeInsightPoint}
            onClear={() => setSelectedPoints([])}
          />
        )}
      </div>
    </div>
  );
};

export default EnergyTradeoffDashboard;
