from pydantic import BaseModel, Field


class TrainModelRequest(BaseModel):
    organization_id: str = Field(..., min_length=1)
    dataset_relative_path: str = Field(..., min_length=1)


class TrainModelResponse(BaseModel):
    accuracy: float
    f1_score: float
    sample_count: int
    model_id: str
