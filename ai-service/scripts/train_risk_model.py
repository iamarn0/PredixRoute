"""Train the risk classifier from an uploaded processed CSV — no synthetic data."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.ml.training.trainer import train_from_csv


def main() -> None:
    parser = argparse.ArgumentParser(description="Train PredixRoute risk model from a processed CSV dataset")
    parser.add_argument("--csv", required=True, help="Path to processed.csv (min 100 rows)")
    parser.add_argument("--org-id", required=True, help="MongoDB organization ID for per-tenant model storage")
    args = parser.parse_args()

    result = train_from_csv(args.csv, args.org_id)
    print(
        f"Saved model for org {args.org_id} "
        f"(accuracy={result.accuracy:.3f}, f1={result.f1_score:.3f}, samples={result.sample_count})"
    )
    print(f"Artifact: {result.artifact_path}")


if __name__ == "__main__":
    main()
