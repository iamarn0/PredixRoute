from fastapi import APIRouter, Depends
from app.core.security import verify_internal_token
from app.schemas.predict import RiskPredictRequest, RiskPredictResponse
from app.services.inference_service import inference_service

router = APIRouter(prefix="/internal/v1/predict", tags=["predict"])


@router.post("/risk", response_model=dict, dependencies=[Depends(verify_internal_token)])
async def predict_risk(request: RiskPredictRequest) -> dict:
    result = inference_service.predict(request)
    return {
        "success": True,
        "data": result.model_dump(
            by_alias=False,
            mode="json",
        ),
    }
