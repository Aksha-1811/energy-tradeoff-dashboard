import { UNITS } from "../../constants/energy";
import { formatNum } from "../../utils/formatters";

interface OperationalSummaryCardProps {
  peakForecast: number;
  avgForecast: number;
  typicalZone: string;
  topFeature: string;
  riskLevel: string;
  recommendation: string;
}

export function OperationalSummaryCard({
  peakForecast,
  avgForecast: _avgForecast,
  typicalZone,
  topFeature,
  riskLevel,
  recommendation,
}: OperationalSummaryCardProps) {
  return (
    <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            AI Operational Summary
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            System outlook: {riskLevel} demand risk
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            The model forecasts future grid import, identifies the most common
            operating range, and highlights the strongest energy driver for
            decision support.
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
            {formatNum(peakForecast)} {UNITS.energy}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Highest predicted grid import in the short horizon.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Typical operating zone</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{typicalZone}</p>
          <p className="mt-1 text-xs text-slate-500">
            Most frequent grid import range in the sampled data.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Main influence</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{topFeature}</p>
          <p className="mt-1 text-xs text-slate-500">
            Strongest feature based on model importance.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-slate-700">
        <span className="font-semibold text-violet-700">Recommendation:</span>{" "}
        {recommendation}
      </div>
    </div>
  );
}
