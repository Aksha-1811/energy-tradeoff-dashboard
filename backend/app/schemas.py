from __future__ import annotations

from pydantic import BaseModel
from typing import List, Dict, Optional, Literal


class EnergyRow(BaseModel):
    X1: float
    X2: float
    X3: float
    X4: float
    X5: float
    Y: float
    energyLevel: Optional[Literal["High", "Low"]] = None


class ModelMetrics(BaseModel):
    r2: float
    mae: float
    rmse: float
    nTrain: int
    nTest: int


class LinearModelInfo(BaseModel):
    intercept: float
    coefficients: Dict[str, float]
    r2: Optional[float] = None  # OPTIONAL but recommended for UI cards


class ForecastPoint(BaseModel):
    step: int
    yHat: float


class Summary(BaseModel):
    yMin: float
    yMax: float
    yMean: float
    corr: Dict[str, float]
    linearModel: LinearModelInfo
    modelMetrics: Optional[ModelMetrics] = None
    featureImportance: Optional[Dict[str, float]] = None
    forecast: Optional[List[ForecastPoint]] = None


class EnergyResponse(BaseModel):
    meta: Dict[str, object]
    thresholds: Dict[str, float]
    summary: Summary
    rows: List[EnergyRow]
