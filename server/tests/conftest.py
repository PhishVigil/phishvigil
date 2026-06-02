import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def http_client():
    with TestClient(app) as c:
        yield c
