from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import verify_internal_token
from app.ml.model_registry import model_registry

router = APIRouter(prefix="/internal/v1", tags=["health"])


@router.get("/health")
async def health_public():
    return {
        "status": "healthy",
        "version": settings.model_version,
        "modelLoaded": model_registry.is_loaded,
        "modelId": model_registry.model_id,
    }


@router.get("/health/secure", dependencies=[Depends(verify_internal_token)])
async def health_secure():
    return {
        "status": "healthy",
        "version": settings.model_version,
        "modelLoaded": model_registry.is_loaded,
        "modelId": model_registry.model_id,
    }
