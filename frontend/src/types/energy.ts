export type FeatureKey = "X1" | "X2" | "X3" | "X4" | "X5";

export type EnergyRow = {
  X1: number;
  X2: number;
  X3: number;
  X4: number;
  X5: number;
  Y: number;
};

export type OperationalSummary = {
  risk_level: string;
  peak_forecast: number;
  average_forecast: number;
  typical_zone: string;
  top_feature: string;
  recommendation: string;
};

export type EnergyApiResponse = {
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
  operational_summary?: OperationalSummary;
};
