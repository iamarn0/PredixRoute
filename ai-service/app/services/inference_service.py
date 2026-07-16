"""Risk inference service with explainable feature impacts."""

from __future__ import annotations

from app.core.config import settings
from app.ml.features.feature_pipeline import FeaturePipeline
from app.ml.model_registry import model_registry
from app.schemas.predict import RiskPredictRequest, RiskPredictResponse, ShapExplanation
from app.services.recommendation_service import rank_couriers


class InferenceService:
    def __init__(self) -> None:
        self.feature_pipeline = FeaturePipeline()

    def predict(self, request: RiskPredictRequest) -> RiskPredictResponse:
        input_dict = request.model_dump()
        features = self.feature_pipeline.transform(input_dict)

        delivery_probability, model_id = model_registry.predict_delivery_probability(
            request.organization_id,
            features,
        )
        risk_score = round((1 - delivery_probability) * 100, 1)
        risk_level = self._classify_risk(risk_score)
        explanations_raw = model_registry.explain(request.organization_id, features)
        explanations = [ShapExplanation(**item) for item in explanations_raw] or self._build_explanations(
            features, request
        )

        rankings = rank_couriers(
            request.available_couriers,
            request.destination_pincode,
            delivery_probability,
            input_dict,
        )
        recommended = rankings[0]["courier"] if rankings else request.available_couriers[0].lower()

        return RiskPredictResponse(
            delivery_probability=delivery_probability,
            risk_score=risk_score,
            risk_level=risk_level,
            recommended_courier=recommended,
            courier_rankings=rankings,
            explanations=explanations,
            model_id=model_id,
            model_version=settings.model_version,
        )

    def _classify_risk(self, score: float) -> str:
        if score < 25:
            return "LOW"
        if score < 50:
            return "MEDIUM"
        if score < 75:
            return "HIGH"
        return "CRITICAL"

    def _build_explanations(self, features: dict, request: RiskPredictRequest) -> list[ShapExplanation]:
        candidates = [
            (
                "pincode_risk_score",
                features["pincode_risk_score"],
                (features["pincode_risk_score"] - 30) / 100,
                f"Destination pincode risk score is {features['pincode_risk_score']:.0f}/100",
            ),
            (
                "address_quality_score",
                request.address_quality_score,
                (0.7 - request.address_quality_score) * 0.5,
                self._address_explanation(request),
            ),
            (
                "cod_risk_bucket",
                features["cod_risk_bucket"],
                features["cod_risk_bucket"] * 0.08,
                "COD shipment increases delivery risk" if request.cod else "Prepaid order reduces COD risk",
            ),
            (
                "avg_courier_success_rate",
                features["avg_courier_success_rate"],
                (0.85 - features["avg_courier_success_rate"]) * 0.6,
                f"Average courier success rate is {features['avg_courier_success_rate']:.0%}",
            ),
            (
                "weight_risk_score",
                features["weight_risk_score"],
                (features["weight_risk_score"] - 20) / 100,
                f"Package weight contributes risk score of {features['weight_risk_score']:.0f}",
            ),
        ]

        explanations: list[ShapExplanation] = []
        for feature, value, impact, description in sorted(candidates, key=lambda x: abs(x[2]), reverse=True)[:5]:
            direction = "INCREASES_RISK" if impact > 0 else "DECREASES_RISK"
            explanations.append(
                ShapExplanation(
                    feature=feature,
                    value=round(value, 4) if isinstance(value, float) else value,
                    impact=round(impact, 4),
                    direction=direction,
                    description=description,
                )
            )
        return explanations

    def _format_quality_percent(self, score: float) -> str:
        return f"{round(score * 100)}%"

    def _address_explanation(self, request: RiskPredictRequest) -> str:
        score = request.address_quality_score
        quality = self._format_quality_percent(score)
        if request.delivery_address:
            preview = request.delivery_address.strip()
            if len(preview) > 60:
                preview = preview[:57] + "..."
            return f'Full delivery address analyzed (quality {quality}): "{preview}"'
        return f"Address quality is {quality}"


inference_service = InferenceService()
