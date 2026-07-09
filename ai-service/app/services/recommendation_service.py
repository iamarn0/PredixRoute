"""Courier recommendation engine."""

from __future__ import annotations

from typing import Any

from app.ml.features.feature_pipeline import COURIER_DEFAULTS, _resolve_courier_stats


WEIGHTS = {
    "success": 0.40,
    "performance": 0.25,
    "rto": 0.15,
    "sla": 0.10,
    "cost": 0.10,
}


def rank_couriers(
    available_couriers: list[str],
    pincode: str,
    success_base: float,
    input_data: dict[str, Any] | None = None,
) -> list[dict]:
    rankings = []
    context = input_data or {"destination_pincode": pincode}

    for courier in available_couriers:
        key = courier.lower()
        perf = _resolve_courier_stats(context, key)

        success_prob = min(0.99, (success_base * 0.6 + perf["success"] * 0.4))
        success_score = success_prob * 100
        historical_score = perf["success"] * 100
        rto_score = (1 - perf["rto"]) * 100
        sla_score = max(0, min(100, (1 - perf["days"] / 10) * 100))
        cost_score = max(0, min(100, (1 - perf["cost"] / 60) * 100))

        breakdown = {
            "successWeight": round(success_score * WEIGHTS["success"], 1),
            "performanceWeight": round(historical_score * WEIGHTS["performance"], 1),
            "rtoWeight": round(rto_score * WEIGHTS["rto"], 1),
            "slaWeight": round(sla_score * WEIGHTS["sla"], 1),
            "costWeight": round(cost_score * WEIGHTS["cost"], 1),
        }

        composite = sum(breakdown.values())

        rankings.append({
            "courier": key,
            "score": round(composite, 1),
            "success_probability": round(success_prob, 4),
            "breakdown": breakdown,
        })

    rankings.sort(key=lambda r: r["score"], reverse=True)
    return rankings
