import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.schemas.health import HealthResponse


def test_healthcheck_ok(http_client: TestClient):
    response = http_client.get("/health")
    now = datetime.now(timezone.utc)

    assert response.status_code == 200

    data = HealthResponse.model_validate(response.json())

    assert data.status == "ok", "Status should be ok"
    assert data.timestamp.tzinfo == timezone.utc, "Timezone should be UTC"

    delta = abs((now - data.timestamp).total_seconds())
    assert (
        delta < 0.5
    ), "Response time should not be differ significantly from datetime.now()"
