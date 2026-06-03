from fastapi.routing import APIRouter
from app.api.v1.incidents import incident_router

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(incident_router)