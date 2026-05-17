import { RefObject } from "react";
import { Line } from "react-chartjs-2";
import { EnergyApiResponse } from "../../types/energy";
import { UNITS } from "../../constants/energy";
import { baseChartOptions, chartTheme } from "../../utils/chartOptions";
import { Section } from "../common/Section";
import { InfoTip } from "../common/InfoTip";

type BehaviorAnalysisProps = {
  data: EnergyApiResponse | null;
  svgRef: RefObject<SVGSVGElement>;
  behaviorChartRef: RefObject<HTMLDivElement>;
  xMeta: { label: string; unit: string };
  showChartGuide: boolean;
  efficiency: { labels: string[]; avg: number[] } | null;
};

export default function BehaviorAnalysis({
  data,
  svgRef,
  behaviorChartRef,
  xMeta,
  showChartGuide,
  efficiency,
}: BehaviorAnalysisProps) {
  return (
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
                The dashed line is <b>median(Y)</b>, a robust threshold: half
                the points lie above, half below.
              </div>
              <div>
                Color = “zone” relative to median(Y): above = higher grid import
                (red), below = lower (green). This is a simple operational split
                for analysis.
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
            <h3 className="text-sm font-semibold">Response Map (Scatter)</h3>
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
                We can’t show 10k+ points clearly, so we <b>bin</b> the X range
                into K intervals.
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
            Smoothed view: Average Grid Import ({UNITS.energy}) across binned{" "}
            {xMeta.label}.
          </div>
        </div>
      </div>
    </Section>
  );
}
