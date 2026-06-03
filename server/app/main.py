from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.api.router import api_router
from app.web.router import web_router
from app.schemas.health import HealthResponse
from app.database.models import Base
from app.database.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) # TODO: alembic migrations
    yield


app = FastAPI(lifespan=lifespan)

static_dir = Path(__file__).parent / "web" / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

app.include_router(api_router)
app.include_router(web_router)


@app.get("/health", response_model=HealthResponse)
async def healthcheck():
    return HealthResponse.ok()
