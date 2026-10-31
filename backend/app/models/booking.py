import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_positive_quantity"),
        Index("ix_bookings_slot_status", "slot_id", "status"),
        Index("ix_bookings_farmer_status", "farmer_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    public_token: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    slot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("procurement_slots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    produce_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="quintal")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="BOOKED", index=True
    )
    queue_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    farmer = relationship("User", back_populates="bookings")
    slot = relationship("ProcurementSlot", back_populates="bookings")
    status_history = relationship(
        "BookingStatusHistory",
        back_populates="booking",
        cascade="all, delete-orphan",
        order_by="BookingStatusHistory.created_at",
    )

