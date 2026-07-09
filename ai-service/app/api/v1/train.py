from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.security import verify_internal_token
from app.ml.model_registry import model_registry
from app.ml.training.trainer import train_from_csv
from app.schemas.train import TrainModelRequest

router = APIRouter(prefix="/internal/v1", tags=["train"])


@router.post("/train", dependencies=[Depends(verify_internal_token)])
async def train_model(request: TrainModelRequest) -> dict:
    dataset_path = Path(settings.dataset_root) / request.dataset_relative_path
    if not dataset_path.exists():
        raise HTTPException(status_code=404, detail=f"Dataset file not found: {request.dataset_relative_path}")

    try:
        result = train_from_csv(dataset_path, request.organization_id)
        model_registry.reload_org(request.organization_id)
        return {
            'success': True,
            'data': {
                'accuracy': result.accuracy,
                'f1_score': result.f1_score,
                'sample_count': result.sample_count,
                'model_id': result.model_id,
            },
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
