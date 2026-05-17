import { EnergyRow, FeatureKey } from "../../types/energy";
import { UNITS } from "../../constants/energy";
import { formatNum } from "../../utils/formatters";

interface InsightPanelProps {
  selectedPoints: EnergyRow[];
  xFeature: FeatureKey;
  xMeta: { label: string; unit: string };
  medianY: number;
  getPointId: (point: EnergyRow) => string;
  onClose: () => void;
  onRemove: (point: EnergyRow) => void;
  onClear: () => void;
}

export function InsightPanel({
  selectedPoints,
  xFeature,
  xMeta,
  medianY,
  getPointId,
  onClose,
  onRemove,
  onClear,
}: InsightPanelProps) {
  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-[380px] flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Insight Panel</h2>
          <p className="text-xs text-slate-500">
            {selectedPoints.length} selected operating point
            {selectedPoints.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close insight panel"
        >
          →
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
        >
          Clear all insights
        </button>

        {selectedPoints.map((point, index) => {
          const isHigh = point.Y >= medianY;
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
                  onClick={() => onRemove(point)}
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
                  <span className="font-semibold text-slate-900">Status:</span>{" "}
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
  );
}
