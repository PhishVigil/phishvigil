from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "status": "ok",
                    "timestamp": "2026-01-01T12:00:00.000000+00:00",
                }
            ]
        },
    )

    status: str = Field(
        default="ok", description="Current status", pattern=r"^(ok|degraded|down)$"
    )
    timestamp: datetime = Field(
        description="Response time (UTC, ISO 8601)",
        default_factory=lambda: datetime.now(timezone.utc),
    )

    @classmethod
    def ok(cls) -> "HealthResponse":
        return cls(status="ok")
