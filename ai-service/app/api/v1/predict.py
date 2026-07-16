from fastapi import APIRouter, Depends, HTTPException
from app.core.security import verify_internal_token
from app.schemas.predict import RiskPredictRequest, RiskPredictResponse
from app.services.inference_service import inference_service

router = APIRouter(prefix="/internal/v1/predict", tags=["predict"])


@router.post("/risk", response_model=dict, dependencies=[Depends(verify_internal_token)])
async def predict_risk(request: RiskPredictRequest) -> dict:
    try:
        result = inference_service.predict(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "success": True,
        "data": result.model_dump(
            by_alias=False,
            mode="json",
        ),
    }
