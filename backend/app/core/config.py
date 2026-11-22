from urllib.parse import urlsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str
    WEBHOOK_SECRET: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Frontend configuration
    FRONTEND_URL: str = "http://localhost:5173"

    @field_validator("FRONTEND_URL")
    @classmethod
    def validate_frontend_url(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        parsed = urlsplit(value)

        if (
            parsed.scheme not in ("http", "https")
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError(
                "FRONTEND_URL must be a valid HTTP or HTTPS origin"
            )

        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()