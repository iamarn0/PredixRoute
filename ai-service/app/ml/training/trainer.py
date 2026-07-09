"""Train XGBoost risk model from a processed CSV dataset."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.ml.features.feature_pipeline import FeaturePipeline
from app.ml.model_registry import FEATURE_COLUMNS, org_model_path


@dataclass
class TrainingResult:
    accuracy: float
    f1_score: float
    sample_count: int
    model_id: str
    artifact_path: str


def train_from_csv(csv_path: str | Path, organization_id: str) -> TrainingResult:
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"Training dataset not found: {path}")

    df = pd.read_csv(path)
    required = {
        'destination_pincode',
        'weight_grams',
        'cod',
        'order_value',
        'address_quality_score',
        'available_couriers',
        'label',
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Processed CSV missing columns: {', '.join(sorted(missing))}")

    if len(df) < 100:
        raise ValueError(f"Minimum 100 rows required for training (found {len(df)})")

    pipeline = FeaturePipeline()
    feature_rows: list[list[float]] = []
    labels: list[int] = []

    for _, row in df.iterrows():
        couriers = [c.strip() for c in str(row['available_couriers']).split('|') if c.strip()]
        if not couriers:
            couriers = [str(row['available_couriers']).strip()]

        features = pipeline.transform(
            {
                'destination_pincode': str(row['destination_pincode']).zfill(6)[-6:],
                'available_couriers': couriers,
                'cod': bool(int(row['cod'])) if str(row['cod']).strip().isdigit() else str(row['cod']).lower() in ('true', '1', 'yes'),
                'cod_amount': float(row['cod_amount']) if 'cod_amount' in df.columns and pd.notna(row.get('cod_amount')) else None,
                'order_value': float(row['order_value']),
                'weight_grams': int(row['weight_grams']),
                'address_quality_score': float(row['address_quality_score']),
            }
        )
        feature_rows.append([features[col] for col in FEATURE_COLUMNS])
        labels.append(int(row['label']))

    X = np.array(feature_rows, dtype=np.float32)
    y = np.array(labels, dtype=np.int32)

    if len(np.unique(y)) < 2:
        raise ValueError('Training data must include both successful and failed delivery labels')

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric='logloss',
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    model_id = f'mdl_xgb_{organization_id[-8:]}'

    artifact_path = org_model_path(organization_id)
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            'model': model,
            'model_id': model_id,
            'accuracy': accuracy,
            'f1_score': f1,
            'sample_count': len(df),
            'organization_id': organization_id,
        },
        artifact_path,
    )

    return TrainingResult(
        accuracy=round(accuracy, 4),
        f1_score=round(f1, 4),
        sample_count=len(df),
        model_id=model_id,
        artifact_path=str(artifact_path),
    )
