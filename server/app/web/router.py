from pathlib import Path

from fastapi import Depends, Request
from fastapi.routing import APIRouter
from fastapi.templating import Jinja2Templates

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.incidents import Incident
from app.database.session import get_session
from app.database.models import PhishingIncident

web_router = APIRouter()

templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))


@web_router.get("/")
async def index(request: Request, db: AsyncSession = Depends(get_session)):
    query = select(PhishingIncident)
    response = await db.execute(query)
    incidents = response.scalars().all()
    return templates.TemplateResponse(
        request,
        "index.html",
        {"incidents": [Incident.model_validate(inc) for inc in incidents]},
    )
