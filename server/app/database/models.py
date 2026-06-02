from datetime import datetime, timezone
from enum import Enum
import uuid

from sqlalchemy import BigInteger, DateTime, Identity, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class EventType(str, Enum):
    PHISH_BLOCKED = "PHISH_BLOCKED"
    USER_OVERRIDE = "USER_OVERRIDE"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    SYSTEM_LOG = "SYSTEM_LOG"


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    client_uuid: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=False
    )

    event_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    event_type: Mapped[EventType] = mapped_column(String(50), nullable=False)

    local_sequence_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    details: Mapped[dict] = mapped_column(JSONB, nullable=False, default={})
