from fastapi import Depends, status
from fastapi.routing import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.incidents import Incident
from app.database.session import get_session
from app.database.models import PhishingIncident

incident_router = APIRouter(prefix="/incidents")


@incident_router.post("/new", status_code=status.HTTP_201_CREATED)
async def new_event(event_in: Incident, db: AsyncSession = Depends(get_session)):
    event = PhishingIncident(**event_in.model_dump())
    db.add(event)
    await db.commit()

    return None


@incident_router.get("/list", response_model=list[Incident])
async def incident_list(db: AsyncSession = Depends(get_session)):
    query = select(PhishingIncident)
    response = await db.execute(query)
    incidents = response.scalars().all()
    return [Incident.model_validate(inc) for inc in incidents]
