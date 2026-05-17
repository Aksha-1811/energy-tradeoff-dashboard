from __future__ import annotations
import io
from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple, List

import numpy as np
import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

EXPECTED_COLS = ["X1", "X2", "X3", "X4", "X5", "Y"]


@dataclass
class AnalyticsConfig:
    seed: int = 225451065
    sample_rows: int = 650


def load_enb_txt(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, sep=r"\s+", header=None)

    if df.shape[1] < 6:
        raise ValueError(f"Dataset must have at least 6 columns, got {df.shape[1]}")

    df = df.iloc[:, :6]
    df.columns = EXPECTED_COLS

    # force numeric & drop bad rows
    df = df.apply(pd.to_numeric, errors="coerce").dropna().reset_index(drop=True)

    return df


def parse_uploaded_txt(content: bytes) -> pd.DataFrame:
    text = content.decode("utf-8", errors="replace")
    df = pd.read_csv(io.StringIO(text), sep=r"\s+", header=None)
    if df.shape[1] < 6:
        raise ValueError(f"Dataset must have at least 6 columns, got {df.shape[1]}")
    df = df.iloc[:, :6]
    df.columns = EXPECTED_COLS
    return df


def sample_df(df: pd.DataFrame, cfg: AnalyticsConfig) -> pd.DataFrame:
    rng = np.random.default_rng(cfg.seed)
    n = min(cfg.sample_rows, len(df))
    idx = rng.choice(df.index.to_numpy(), size=n, replace=False)
    return df.loc[idx].reset_index(drop=True)


def add_energy_level(df: pd.DataFrame) -> Tuple[pd.DataFrame, float]:
    median_y = float(df["Y"].median())
    out = df.copy()
    out["energyLevel"] = np.where(out["Y"] >= median_y, "High", "Low")
    return out, median_y


def correlations(df: pd.DataFrame) -> Dict[str, float]:
    corr = {}
    for col in ["X1", "X2", "X3", "X4", "X5"]:
        corr[col] = float(df[[col, "Y"]].corr(numeric_only=True).iloc[0, 1])
    return corr


def fit_simple_model(df: pd.DataFrame) -> Dict[str, Any]:
    X = df[["X1", "X2", "X3", "X4", "X5"]].to_numpy()
    y = df["Y"].to_numpy()
    model = LinearRegression().fit(X, y)

    return {
        "intercept": float(model.intercept_),
        "coefficients": {f"X{i+1}": float(model.coef_[i]) for i in range(5)},
        "r2": float(model.score(X, y)),
    }


def build_payload(
    df: pd.DataFrame, cfg: AnalyticsConfig, source: str
) -> Dict[str, Any]:
    sampled = sample_df(df, cfg)
    labeled, median_y = add_energy_level(sampled)

    feature_cols = ["X1", "X2", "X3", "X4", "X5"]

    # main summary stats + simple linear model
    summary: Dict[str, Any] = {
        "yMin": float(labeled["Y"].min()),
        "yMax": float(labeled["Y"].max()),
        "yMean": float(labeled["Y"].mean()),
        "corr": correlations(labeled),
        "linearModel": fit_simple_model(labeled),
    }

    # predictive model (train/test metrics + points)
    pred = train_predictive_model(labeled, feature_cols, target_col="Y")

    # attach metrics (schema expects nTrain/nTest too)
    summary["modelMetrics"] = {
        "r2": float(pred["metrics"]["r2"]),
        "mae": float(pred["metrics"]["mae"]),
        "rmse": float(pred["metrics"]["rmse"]),
        "nTrain": int(pred["metrics"]["nTrain"]),
        "nTest": int(pred["metrics"]["nTest"]),
    }

    # simple feature importance for bar chart (abs(coef) from Ridge)
    # (we’ll return as positive magnitudes)
    summary["featureImportance"] = pred["featureImportance"]

    # forecast for line chart (next 24 steps)
    summary["forecast"] = pred["forecast"]

    operational_summary = build_operational_summary(
        forecast=pred["forecast"],
        feature_importance=pred["featureImportance"],
        df=labeled,
        target_col="Y",
    )

    return {
        "meta": {
            "seed": cfg.seed,
            "sampledRows": int(len(labeled)),
            "source": source,
            "columns": EXPECTED_COLS,
        },
        "thresholds": {"medianY": float(median_y)},
        "summary": summary,
        "operational_summary": operational_summary,
        "rows": labeled.to_dict(orient="records"),
    }


def build_operational_summary(
    forecast: List[Dict[str, Any]],
    feature_importance: Dict[str, float],
    df: pd.DataFrame,
    target_col: str = "Y",
) -> Dict[str, Any]:
    y_values = df[target_col].to_numpy()

    peak_forecast = float(max(item["yHat"] for item in forecast))
    average_forecast = float(np.mean([item["yHat"] for item in forecast]))

    hist_counts, bin_edges = np.histogram(y_values, bins=12)
    top_bin_idx = int(np.argmax(hist_counts))
    typical_zone = f"{bin_edges[top_bin_idx]:.1f}–{bin_edges[top_bin_idx + 1]:.1f}"

    top_feature_key = max(feature_importance, key=feature_importance.get)
    feature_labels = {
        "X1": "Heat Pump (X1)",
        "X2": "PV / Solar Generation (X2)",
        "X3": "EV Charging (X3)",
        "X4": "Washing Machine (X4)",
        "X5": "Dishwasher (X5)",
    }

    risk_level = (
        "Elevated"
        if peak_forecast > average_forecast * 1.08
        else "Moderate" if peak_forecast > average_forecast * 1.03 else "Stable"
    )

    recommendation = (
        "Monitor high-load periods and shift flexible appliance usage when forecasted grid import is high."
        if risk_level in ["Moderate", "Elevated"]
        else "System appears stable. Continue monitoring operating patterns and maintain current scheduling strategy."
    )

    return {
        "risk_level": risk_level,
        "peak_forecast": peak_forecast,
        "average_forecast": average_forecast,
        "typical_zone": typical_zone,
        "top_feature": feature_labels.get(top_feature_key, top_feature_key),
        "recommendation": recommendation,
    }


def train_predictive_model(
    df: pd.DataFrame,
    feature_cols: List[str],
    target_col: str = "Y",
    forecast_steps: int = 24,
) -> Dict[str, Any]:
    X = df[feature_cols].to_numpy()
    y = df[target_col].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42
    )

    model = Pipeline([("scaler", StandardScaler()), ("reg", Ridge(alpha=1.0))])
    model.fit(X_train, y_train)

    y_pred_test = model.predict(X_test)

    mae = float(mean_absolute_error(y_test, y_pred_test))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    r2 = float(r2_score(y_test, y_pred_test))

    parity_points = [
        {"actual": float(a), "predicted": float(p)}
        for a, p in zip(y_test[:300], y_pred_test[:300])
    ]

    residuals = y_test - y_pred_test
    residual_points = [
        {"x": float(X_test[i, 0]), "residual": float(residuals[i])}
        for i in range(min(300, len(residuals)))
    ]

    # Feature importance from Ridge coefficients (after scaling pipeline)
    reg: Ridge = model.named_steps["reg"]
    coef = reg.coef_
    feature_importance = {
        feature_cols[i]: float(abs(coef[i])) for i in range(len(feature_cols))
    }

    # Forecast: start from last row features and perturb slightly
    rng = np.random.default_rng(42)
    base = X[-1].astype(float)

    forecast: List[Dict[str, Any]] = []
    current = base.copy()
    for step in range(1, forecast_steps + 1):
        # small noise so curve isn’t flat; keep it stable + not crazy
        noise = rng.normal(loc=0.0, scale=0.02, size=current.shape)
        current = current * (1.0 + noise)

        y_hat = float(model.predict(current.reshape(1, -1))[0])
        forecast.append({"step": int(step), "yHat": y_hat})

    return {
        "metrics": {
            "mae": mae,
            "rmse": rmse,
            "r2": r2,
            "nTrain": int(len(y_train)),
            "nTest": int(len(y_test)),
        },
        "parityPoints": parity_points,
        "residualPoints": residual_points,
        "featureImportance": feature_importance,
        "forecast": forecast,
        "modelInfo": {"type": "RidgeRegression", "features": feature_cols},
    }


def detect_anomalies_zscore(
    df: pd.DataFrame, target_col: str = "Y", z_thresh: float = 3.0
) -> Dict[str, Any]:
    y = df[target_col].to_numpy()
    z = (y - y.mean()) / (y.std() + 1e-9)
    is_anom = np.abs(z) >= z_thresh

    df_out = df.copy()
    df_out["is_anomaly"] = is_anom

    # top anomalies by absolute z-score
    anom_idx = (
        np.argsort(-np.abs(z[is_anom])) if is_anom.any() else np.array([], dtype=int)
    )
    anoms = df_out[is_anom].copy()
    anoms["z"] = z[is_anom]

    top = anoms.sort_values("z", key=lambda s: np.abs(s), ascending=False).head(10)

    top_rows = [
        {
            "x1": float(row.get("X1", np.nan)),
            "y": float(row[target_col]),
            "z": float(row["z"]),
        }
        for _, row in top.iterrows()
    ]

    return {
        "anomalyCount": int(is_anom.sum()),
        "topAnomalies": top_rows,
        "withFlags": df_out,  # keep internal; don’t return full df to UI
    }


def energy_percentiles(df: pd.DataFrame, target_col: str = "Y") -> Dict[str, float]:
    y = df[target_col].to_numpy()
    return {
        "p50": float(np.percentile(y, 50)),
        "p90": float(np.percentile(y, 90)),
        "p95": float(np.percentile(y, 95)),
        "p99": float(np.percentile(y, 99)),
    }
