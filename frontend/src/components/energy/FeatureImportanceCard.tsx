import { Bar } from "react-chartjs-2";
import { baseChartOptions, chartTheme } from "../../utils/chartOptions";
import { Section } from "../common/Section";
import { InfoTip } from "../common/InfoTip";

interface ControlInfluenceMapProps {
  labels: string[];
  values: number[];
}

export function ControlInfluenceMap({
  labels,
  values,
}: ControlInfluenceMapProps) {
  return (
    <Section
      title="Control Influence Map"
      subtitle="Feature ranking used to prioritize optimization and control decisions"
    >
      <div className="relative rounded-2xl border bg-white p-4 shadow-sm overflow-visible">
        <InfoTip title="Feature Importance (|Ridge Coef|)">
          <div className="space-y-2">
            <div>
              We use absolute Ridge coefficients as a simple importance proxy:
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              Importance(Xᵢ) = <b>|βᵢ|</b>
            </div>
            <div>
              Bigger bar = stronger influence on predicted Y (given standardized
              inputs). It's a lightweight "control priority" indicator.
            </div>
          </div>
        </InfoTip>

        <h3 className="text-sm font-semibold">Feature Importance</h3>
        <div className="mt-3 h-[300px]">
          {labels.length > 0 ? (
            <Bar
              data={{
                labels,
                datasets: [
                  {
                    label: "Importance (|coef|)",
                    data: values,
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
  );
}
