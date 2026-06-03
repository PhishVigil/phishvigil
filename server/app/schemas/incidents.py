from typing import Any

from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid

class Incident(BaseModel):
    client_uuid: uuid.UUID
    event_time: datetime
    domain: str
    details: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)