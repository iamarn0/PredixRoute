"""Ensure ML models exist on startup (global + optional platform org)."""

from __future__ import annotations

import logging
from pathlib import Path

from app.core.config import settings
from app.ml.model_registry import GLOBAL_ORG_ID, model_registry, org_model_path
from app.ml.training.trainer import train_from_csv

logger = logging.getLogger(__name__)

BOOTSTRAP_DATASET = "bootstrap/processed.csv"


def _bootstrap_csv_path() -> Path:
    return Path(settings.dataset_root) / BOOTSTRAP_DATASET


def ensure_bootstrap_models(platform_org_id: str | None = None) -> None:
    """Train global and platform-org models from bootstrap CSV when artifacts are missing."""
    csv_path = _bootstrap_csv_path()
    if not csv_path.exists():
        logger.warning("Bootstrap dataset missing at %s — ML predictions unavailable until a model is trained", csv_path)
        return

    targets: list[tuple[str, str]] = []
    if model_registry.get_org_model(GLOBAL_ORG_ID) is None:
        targets.append((GLOBAL_ORG_ID, "global fallback"))

    if platform_org_id and model_registry.get_org_model(platform_org_id) is None:
        targets.append((platform_org_id, "platform org"))

    for org_id, label in targets:
        try:
            result = train_from_csv(csv_path, org_id)
            model_registry.reload_org(org_id)
            logger.info(
                "Bootstrapped %s ML model (org=%s, accuracy=%.3f, samples=%d)",
                label,
                org_id,
                result.accuracy,
                result.sample_count,
            )
        except Exception as exc:
            logger.error("Failed to bootstrap %s model: %s", label, exc)

    if model_registry.is_loaded:
        logger.info("ML model registry ready (modelLoaded=true)")
    else:
        logger.warning("No ML models loaded after bootstrap attempt")
