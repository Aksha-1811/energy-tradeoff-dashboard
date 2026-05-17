import { FeatureKey } from "../types/energy";

export const API_BASE = "http://localhost:8004";

export const UNITS = {
  power: "W",
  energy: "W",
  count: "count",
};

export const FEATURE_META: Record<FeatureKey, { label: string; unit: string }> =
  {
    X1: { label: "Heat Pump (X1)", unit: UNITS.power },
    X2: { label: "PV (X2)", unit: UNITS.power },
    X3: { label: "EV (X3)", unit: UNITS.power },
    X4: { label: "Washing Machine (X4)", unit: UNITS.power },
    X5: { label: "Dishwasher (X5)", unit: UNITS.power },
  };
