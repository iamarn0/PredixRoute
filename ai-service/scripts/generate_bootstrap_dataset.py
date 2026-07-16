"""Generate a labeled bootstrap CSV for initial XGBoost training (dev / first deploy)."""

from __future__ import annotations

import argparse
import csv
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.ml.features.feature_pipeline import FeaturePipeline

PINCODES = ["110001", "400001", "560001", "700001", "600001", "845401", "302001", "500001"]
COURIERS = ["delhivery", "bluedart", "dtdc", "ecom_express"]


def _delivery_probability(features: dict[str, float]) -> float:
    """Ground-truth proxy aligned with logistics signals (not random labels)."""
    risk = (
        features["pincode_risk_score"] * 0.25
        + features["address_risk_score"] * 0.20
        + features["weight_risk_score"] * 0.10
        + features["cod_risk_bucket"] * 8 * 0.15
        + (1 - features["avg_courier_success_rate"]) * 100 * 0.20
        + features["pincode_rto_rate"] * 100 * 0.10
    ) / 100
    return max(0.05, min(0.95, 1 - risk))


def generate_rows(count: int, seed: int = 42) -> list[dict]:
    random.seed(seed)
    pipeline = FeaturePipeline()
    rows: list[dict] = []

    for _ in range(count):
        pincode = random.choice(PINCODES)
        couriers = random.sample(COURIERS, k=random.randint(1, 3))
        cod = random.random() < 0.55
        order_value = round(random.uniform(500, 25000), 2)
        cod_amount = round(order_value * random.uniform(0.8, 1.0), 2) if cod else 0.0
        weight_grams = random.choice([250, 500, 1200, 2500, 5000, 12000, 25000])
        address_quality_score = round(random.uniform(0.35, 0.98), 3)

        features = pipeline.transform(
            {
                "destination_pincode": pincode,
                "available_couriers": couriers,
                "cod": cod,
                "cod_amount": cod_amount if cod else None,
                "order_value": order_value,
                "weight_grams": weight_grams,
                "address_quality_score": address_quality_score,
            }
        )

        delivery_prob = _delivery_probability(features)
        label = 1 if random.random() < delivery_prob else 0

        rows.append(
            {
                "destination_pincode": pincode,
                "weight_grams": weight_grams,
                "cod": int(cod),
                "cod_amount": cod_amount if cod else "",
                "order_value": order_value,
                "address_quality_score": address_quality_score,
                "available_couriers": "|".join(couriers),
                "label": label,
            }
        )

    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=600)
    parser.add_argument(
        "--output",
        default=str(ROOT.parent / "data" / "datasets" / "bootstrap" / "processed.csv"),
    )
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    rows = generate_rows(args.rows)
    fieldnames = [
        "destination_pincode",
        "weight_grams",
        "cod",
        "cod_amount",
        "order_value",
        "address_quality_score",
        "available_couriers",
        "label",
    ]
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    label_mean = sum(r["label"] for r in rows) / len(rows)
    print(f"Wrote {len(rows)} rows to {output} (label balance: {label_mean:.2f})")


if __name__ == "__main__":
    main()
