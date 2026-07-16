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

TIER_COURIER_BIAS = {
    "METRO": {"bluedart": 1.04, "delhivery": 1.02, "dtdc": 0.96, "ecom_express": 1.0},
    "TIER1": {"delhivery": 1.03, "bluedart": 1.02, "ecom_express": 1.0, "dtdc": 0.97},
    "TIER2": {"delhivery": 1.02, "dtdc": 1.01, "bluedart": 1.0, "ecom_express": 0.99},
    "TIER3": {"dtdc": 1.03, "delhivery": 1.02, "ecom_express": 1.0, "bluedart": 0.98},
    "RURAL": {"dtdc": 1.05, "delhivery": 1.03, "ecom_express": 0.98, "bluedart": 0.94},
}


def _pincode_tier(context: dict[str, Any]) -> str:
    pincode_context = context.get("pincode_context") or {}
    tier = str(pincode_context.get("tier", "TIER2")).upper()
    return tier if tier in TIER_COURIER_BIAS else "TIER2"


def _pincode_courier_stats(context: dict[str, Any], courier_code: str) -> dict[str, float] | None:
    pincode_context = context.get("pincode_context") or {}
    key = courier_code.lower()
    for item in pincode_context.get("courier_breakdown", []):
        if str(item.get("courier_code", "")).lower() == key:
            return {
                "success": float(item.get("success_rate", 0.8)),
                "rto": float(item.get("rto_rate", 0.2)),
                "days": float(item.get("avg_delivery_days", 5.0)),
            }
    return None


def _courier_success_probability(
    success_base: float,
    perf: dict[str, float],
    pincode_perf: dict[str, float] | None,
    tier_bias: float,
) -> float:
    pincode_success = pincode_perf["success"] if pincode_perf else perf["success"]
    blended = success_base * 0.35 + pincode_success * 0.45 + perf["success"] * 0.20
    return min(0.99, max(0.05, blended * tier_bias))


def rank_couriers(
    available_couriers: list[str],
    pincode: str,
    success_base: float,
    input_data: dict[str, Any] | None = None,
) -> list[dict]:
    context = input_data or {"destination_pincode": pincode}
    tier = _pincode_tier(context)
    tier_bias_map = TIER_COURIER_BIAS.get(tier, TIER_COURIER_BIAS["TIER2"])
    rankings: list[dict] = []

    for courier in available_couriers:
        key = courier.lower()
        perf = _resolve_courier_stats(context, key)
        pincode_perf = _pincode_courier_stats(context, key)
        tier_bias = tier_bias_map.get(key, 1.0)

        if pincode_perf:
            perf = {
                "success": pincode_perf["success"],
                "rto": pincode_perf["rto"],
                "days": pincode_perf["days"],
                "cost": perf["cost"],
            }

        success_prob = _courier_success_probability(success_base, perf, pincode_perf, tier_bias)
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
            "_rto_rate": perf["rto"],
            "_delivery_days": perf["days"],
        })

    rankings.sort(
        key=lambda r: (
            r["score"],
            r["success_probability"],
            -r["_rto_rate"],
            -r["_delivery_days"],
        ),
        reverse=True,
    )

    for item in rankings:
        item.pop("_rto_rate", None)
        item.pop("_delivery_days", None)

    return rankings
