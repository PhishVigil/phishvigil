from fastapi import FastAPI
from datetime import datetime

from app.api.router import api_router
from app.schemas.health import HealthResponse

app = FastAPI()

app.include_router(api_router)


@app.get("/health", response_model=HealthResponse)
async def healthcheck():
    return HealthResponse.ok()
