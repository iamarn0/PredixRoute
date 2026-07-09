"""Feature engineering pipeline for shipment risk prediction."""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any

TIER_ENCODING = {
    "METRO": 0,
    "TIER1": 1,
    "TIER2": 2,
    "TIER3": 3,
    "RURAL": 4,
}

PINCODE_DEFAULTS = {
    "110001": {"risk": 15, "success": 0.94, "rto": 0.06, "days": 2.3, "tier": 0},
    "400001": {"risk": 22, "success": 0.91, "rto": 0.09, "days": 2.8, "tier": 0},
    "560001": {"risk": 20, "success": 0.92, "rto": 0.08, "days": 2.5, "tier": 0},
    "700001": {"risk": 25, "success": 0.89, "rto": 0.11, "days": 3.1, "tier": 0},
}

COURIER_DEFAULTS = {
    "delhivery": {"success": 0.92, "rto": 0.08, "days": 2.8, "cost": 42},
    "bluedart": {"success": 0.94, "rto": 0.06, "days": 2.5, "cost": 48},
    "dtdc": {"success": 0.88, "rto": 0.12, "days": 3.5, "cost": 38},
    "ecom_express": {"success": 0.90, "rto": 0.10, "days": 3.0, "cost": 40},
}


def _resolve_pincode_stats(input_data: dict[str, Any]) -> dict[str, float | int]:
    pincode_context = input_data.get("pincode_context")
    if pincode_context:
        tier = pincode_context.get("tier", "TIER2")
        return {
            "risk": float(pincode_context["risk_score"]),
            "success": float(pincode_context["success_rate"]),
            "rto": float(pincode_context["rto_rate"]),
            "days": float(pincode_context["avg_delivery_days"]),
            "tier": TIER_ENCODING.get(str(tier).upper(), 2),
        }

    pincode = input_data["destination_pincode"]
    return PINCODE_DEFAULTS.get(
        pincode,
        {"risk": 45, "success": 0.85, "rto": 0.15, "days": 4.0, "tier": 2},
    )


def _resolve_courier_stats(input_data: dict[str, Any], courier_code: str) -> dict[str, float]:
    key = courier_code.lower()
    fallback = COURIER_DEFAULTS.get(key, {"success": 0.80, "rto": 0.20, "days": 5.0, "cost": 50})

    pincode_context = input_data.get("pincode_context") or {}
    for item in pincode_context.get("courier_breakdown", []):
        if str(item.get("courier_code", "")).lower() == key:
            return {
                "success": float(item.get("success_rate", fallback["success"])),
                "rto": float(item.get("rto_rate", fallback["rto"])),
                "days": float(item.get("avg_delivery_days", fallback["days"])),
                "cost": fallback["cost"],
            }

    for item in input_data.get("courier_contexts", []):
        if str(item.get("courier_code", "")).lower() == key:
            return {
                "success": float(item.get("success_rate", fallback["success"])),
                "rto": float(item.get("rto_rate", fallback["rto"])),
                "days": float(item.get("avg_delivery_days", fallback["days"])),
                "cost": float(item.get("avg_cost_per_kg", fallback["cost"])),
            }

    return fallback


class FeaturePipeline:
    def transform(self, input_data: dict[str, Any]) -> dict[str, float]:
        pin = _resolve_pincode_stats(input_data)

        couriers = input_data["available_couriers"]
        courier_rates = [_resolve_courier_stats(input_data, c)["success"] for c in couriers]

        cod = input_data["cod"]
        cod_amount = input_data.get("cod_amount") or 0
        order_value = input_data["order_value"]
        weight = input_data["weight_grams"]
        address_score = input_data["address_quality_score"]
        address_analysis = input_data.get("address_analysis") or {}

        # Penalize incomplete addresses beyond the base quality score
        address_penalty = 0.0
        if address_analysis.get("issues"):
            address_penalty += min(0.12, len(address_analysis["issues"]) * 0.04)
        if address_analysis.get("pincode_match") is False:
            address_penalty += 0.08
        if address_analysis.get("has_house_number") is False:
            address_penalty += 0.06
        if address_analysis.get("has_street_or_area") is False:
            address_penalty += 0.06

        adjusted_address_score = max(0.0, min(1.0, address_score - address_penalty))

        cod_bucket = 0
        if cod and cod_amount > 10000:
            cod_bucket = 4
        elif cod and cod_amount > 5000:
            cod_bucket = 3
        elif cod and cod_amount > 2000:
            cod_bucket = 2
        elif cod and cod_amount > 500:
            cod_bucket = 1

        weight_bucket = 0
        if weight > 30000:
            weight_bucket = 5
        elif weight > 15000:
            weight_bucket = 4
        elif weight > 5000:
            weight_bucket = 3
        elif weight > 2000:
            weight_bucket = 2
        elif weight > 500:
            weight_bucket = 1

        now = datetime.utcnow()

        return {
            "pincode_risk_score": float(pin["risk"]),
            "pincode_success_rate": float(pin["success"]),
            "pincode_rto_rate": float(pin["rto"]),
            "pincode_avg_delivery_days": float(pin["days"]),
            "pincode_tier_encoded": float(pin["tier"]),
            "top_courier_success_rate": max(courier_rates) if courier_rates else 0.80,
            "avg_courier_success_rate": sum(courier_rates) / len(courier_rates) if courier_rates else 0.80,
            "courier_count_available": float(len(couriers)),
            "cod_flag": 1.0 if cod else 0.0,
            "cod_amount_normalized": min(cod_amount / order_value, 1.0) if cod and order_value else 0.0,
            "cod_risk_bucket": float(cod_bucket),
            "order_value_log": math.log1p(order_value),
            "weight_grams_normalized": weight / 50000,
            "weight_bucket": float(weight_bucket),
            "weight_risk_score": min(100, (weight / 50000) * 60 + weight_bucket * 8),
            "address_quality_score": adjusted_address_score,
            "address_risk_score": (1 - adjusted_address_score) * 100,
            "address_issue_count": float(len(address_analysis.get("issues", []))),
            "day_of_week": float(now.weekday()),
            "is_weekend": 1.0 if now.weekday() >= 5 else 0.0,
        }
