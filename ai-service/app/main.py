from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import predict, health, train
from app.core.config import settings
from app.ml.bootstrap import ensure_bootstrap_models
from app.ml.model_registry import model_registry


@asynccontextmanager
async def lifespan(_app: FastAPI):
    model_registry.load()
    if settings.bootstrap_model_on_startup:
        ensure_bootstrap_models(settings.platform_org_id or None)
    yield


app = FastAPI(
    title="PredixRoute AI Service",
    description="Internal ML inference service — not exposed to public clients",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(train.router)


@app.get("/")
async def root():
    return {
        "service": "predixroute-ai-service",
        "status": "running",
        "modelLoaded": model_registry.is_loaded,
        "modelId": model_registry.model_id,
    }
