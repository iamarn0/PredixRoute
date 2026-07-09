"""XGBoost model registry with SHAP explainability."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import shap

FEATURE_COLUMNS = [
    "pincode_risk_score",
    "pincode_success_rate",
    "pincode_rto_rate",
    "pincode_avg_delivery_days",
    "pincode_tier_encoded",
    "top_courier_success_rate",
    "avg_courier_success_rate",
    "courier_count_available",
    "cod_flag",
    "cod_amount_normalized",
    "cod_risk_bucket",
    "order_value_log",
    "weight_grams_normalized",
    "weight_bucket",
    "weight_risk_score",
    "address_quality_score",
    "address_risk_score",
    "day_of_week",
    "is_weekend",
]

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"


def org_model_path(organization_id: str) -> Path:
    return MODELS_DIR / "orgs" / organization_id / "risk_classifier.joblib"


class LoadedModel:
    def __init__(self, artifact: dict[str, Any]) -> None:
        self.model = artifact["model"]
        self.model_id = artifact.get("model_id", "mdl_xgb")
        self.explainer = shap.TreeExplainer(self.model)


class ModelRegistry:
    def __init__(self) -> None:
        self._org_cache: dict[str, LoadedModel] = {}

    def load(self) -> None:
        """Startup hook — org models are loaded on demand."""
        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        (MODELS_DIR / "orgs").mkdir(parents=True, exist_ok=True)

    def reload_org(self, organization_id: str) -> None:
        self._org_cache.pop(organization_id, None)
        self.get_org_model(organization_id)

    def get_org_model(self, organization_id: str) -> LoadedModel | None:
        if organization_id in self._org_cache:
            return self._org_cache[organization_id]

        path = org_model_path(organization_id)
        if not path.exists():
            return None

        artifact = joblib.load(path)
        loaded = LoadedModel(artifact)
        self._org_cache[organization_id] = loaded
        return loaded

    @property
    def is_loaded(self) -> bool:
        orgs_dir = MODELS_DIR / "orgs"
        return orgs_dir.exists() and any(orgs_dir.rglob("risk_classifier.joblib"))

    @property
    def model_id(self) -> str:
        return "mdl_per_org"

    def feature_vector(self, features: dict[str, float]) -> np.ndarray:
        return np.array([[features[col] for col in FEATURE_COLUMNS]], dtype=np.float32)

    def predict_delivery_probability(self, organization_id: str, features: dict[str, float]) -> tuple[float, str] | None:
        loaded = self.get_org_model(organization_id)
        if not loaded:
            return None
        proba = float(loaded.model.predict_proba(self.feature_vector(features))[0][1])
        return round(max(0.01, min(0.99, proba)), 4), loaded.model_id

    def explain(self, organization_id: str, features: dict[str, float], top_k: int = 5) -> list[dict[str, Any]]:
        loaded = self.get_org_model(organization_id)
        if not loaded:
            return []
        vector = self.feature_vector(features)
        shap_values = loaded.explainer.shap_values(vector)
        values = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        pairs = sorted(
            zip(FEATURE_COLUMNS, values, [features[c] for c in FEATURE_COLUMNS]),
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        explanations = []
        for feature, impact, value in pairs[:top_k]:
            explanations.append(
                {
                    "feature": feature,
                    "value": round(float(value), 4),
                    "impact": round(float(impact), 4),
                    "direction": "INCREASES_RISK" if impact > 0 else "DECREASES_RISK",
                    "description": f"{feature.replace('_', ' ').title()} contributed {impact:+.3f} to delivery outcome",
                }
            )
        return explanations


model_registry = ModelRegistry()
