from datetime import datetime, timezone
from enum import Enum
from typing import Any
import uuid


from sqlalchemy import BigInteger, DateTime, Identity, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PhishingIncident(Base):
    __tablename__ = "phishing_incidents"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    client_uuid: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )

    domain: Mapped[str] = mapped_column(String(255), nullable=False)

    event_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    details: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default={})
    
