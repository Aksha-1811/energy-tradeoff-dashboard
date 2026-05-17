import { EnergyApiResponse, FeatureKey, EnergyRow } from "../../types/energy";
import { API_BASE } from "../../constants/energy";
import { formatNum } from "../../utils/formatters";

type FeatureOption = {
  key: FeatureKey;
  text: string;
};

type EnergyHeroProps = {
  data: EnergyApiResponse | null;
  previewRows: EnergyRow[];
  sampleRows: number;
  setSampleRows: (value: number) => void;
  seed: number;
  setSeed: (value: number) => void;
  xFeature: FeatureKey;
  setXFeature: (value: FeatureKey) => void;
  featureOptions: FeatureOption[];
  loadData: () => void;
  loading: boolean;
  errorMsg: string | null;
};

export default function EnergyHero({
  data,
  previewRows,
  sampleRows,
  setSampleRows,
  seed,
  setSeed,
  xFeature,
  setXFeature,
  featureOptions,
  loadData,
  loading,
  errorMsg,
}: EnergyHeroProps) {
  return (
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
                X1 Heat Pump, X2 PV, X3 EV, X4 Washing Machine, X5 Dishwasher.
              </span>
              <br />
              <span className="text-white/85">Y is Grid Import (target).</span>
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
                onClick={loadData}
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
  );
}
