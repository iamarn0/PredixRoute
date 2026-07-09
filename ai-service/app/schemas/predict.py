from pydantic import BaseModel, Field, field_validator
from typing import Optional


class PincodeCourierBreakdown(BaseModel):
    courier_code: str
    success_rate: float
    rto_rate: float
    avg_delivery_days: float


class PincodeContext(BaseModel):
    risk_score: float
    success_rate: float
    rto_rate: float
    avg_delivery_days: float
    tier: str = "TIER2"
    source: str = "DEFAULT"
    courier_breakdown: list[PincodeCourierBreakdown] = Field(default_factory=list)


class CourierContext(BaseModel):
    courier_code: str
    success_rate: float
    rto_rate: float
    avg_delivery_days: float
    avg_cost_per_kg: float = 45.0
    source: str = "DEFAULT"


class RiskPredictRequest(BaseModel):
    organization_id: str
    destination_pincode: str = Field(..., pattern=r"^\d{6}$")
    delivery_address: Optional[str] = Field(default=None, max_length=500)
    weight_grams: int = Field(..., ge=1, le=50000)
    cod: bool
    cod_amount: Optional[float] = None
    order_value: float = Field(..., gt=0)
    address_quality_score: float = Field(..., ge=0, le=1)
    address_analysis: Optional[dict] = None
    available_couriers: list[str] = Field(..., min_length=1, max_length=20)
    external_ref: Optional[str] = None
    pincode_context: Optional[PincodeContext] = None
    courier_contexts: list[CourierContext] = Field(default_factory=list)

    @field_validator("cod_amount")
    @classmethod
    def validate_cod_amount(cls, v, info):
        if info.data.get("cod") and (v is None or v <= 0):
            raise ValueError("cod_amount required when cod is true")
        return v


class ShapExplanation(BaseModel):
    feature: str
    value: float | str
    impact: float
    direction: str
    description: str


class CourierRanking(BaseModel):
    courier: str
    score: float
    success_probability: float
    breakdown: dict


class RiskPredictResponse(BaseModel):
    delivery_probability: float
    risk_score: float
    risk_level: str
    recommended_courier: str
    courier_rankings: list[CourierRanking]
    explanations: list[ShapExplanation]
    model_id: str
    model_version: str
