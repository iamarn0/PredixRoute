from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    internal_token: str = Field(default="dev_internal_token_min_16", validation_alias="INTERNAL_TOKEN")
    model_version: str = Field(default="1.0.0", validation_alias="MODEL_VERSION")
    dataset_root: str = Field(default="../data/datasets", validation_alias="DATASET_ROOT")


settings = Settings()
