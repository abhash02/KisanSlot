import secrets
from datetime import date, time, datetime, timezone
from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from fastapi import HTTPException, status

from app.models.slot import ProcurementSlot
from app.models.booking import Booking
from app.models.history import BookingStatusHistory
from app.models.user import User

CAPACITY_CONSUMING_STATUSES = ["BOOKED", "ARRIVED", "IN_SERVICE"]

ALLOWED_TRANSITIONS = {
    "BOOKED": ["ARRIVED", "CANCELLED", "REJECTED"],
    "ARRIVED": ["IN_SERVICE", "CANCELLED"],
    "IN_SERVICE": ["COMPLETED"],
    "COMPLETED": [],
    "CANCELLED": [],
    "REJECTED": [],
}


def get_slot_booked_count(db: Session, slot_id: UUID) -> int:
    """Return count of active bookings consuming slot capacity."""
    count = (
        db.query(func.count(Booking.id))
        .filter(
            Booking.slot_id == slot_id,
            Booking.status.in_(CAPACITY_CONSUMING_STATUSES),
        )
        .scalar()
    )
    return count or 0


def get_slot_remaining_capacity(db: Session, slot: ProcurementSlot) -> int:
    """Calculate remaining capacity for a slot."""
    booked = get_slot_booked_count(db, slot.id)
    return max(0, slot.capacity - booked)


def check_slot_overlap(
    db: Session,
    centre_id: UUID,
    slot_date: date,
    start_time: time,
    end_time: time,
    exclude_slot_id: Optional[UUID] = None,
) -> bool:
    """
    Check if a new or updated slot overlaps with an existing active/open slot
    at the same procurement centre on the same date.
    Returns True if an overlap exists, False otherwise.
    Two intervals (s1, e1) and (s2, e2) overlap if s1 < e2 and e1 > s2.
    """
    query = db.query(ProcurementSlot).filter(
        ProcurementSlot.centre_id == centre_id,
        ProcurementSlot.slot_date == slot_date,
        ProcurementSlot.status != "CANCELLED",
        ProcurementSlot.start_time < end_time,
        ProcurementSlot.end_time > start_time,
    )
    if exclude_slot_id:
        query = query.filter(ProcurementSlot.id != exclude_slot_id)

    return query.first() is not None


def generate_unique_token(db: Session, booking_date: date) -> str:
    """
    Generate a cryptographically secure, non-guessable booking token.
    Format: KS-YYYYMMDD-XXXXXX
    """
    date_str = booking_date.strftime("%Y%m%d")
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # Exclude visually ambiguous 0, O, 1, I

    for _ in range(10):
        random_suffix = "".join(secrets.choice(alphabet) for _ in range(6))
        candidate_token = f"KS-{date_str}-{random_suffix}"

        # Ensure uniqueness in DB
        exists = db.query(Booking.id).filter(Booking.public_token == candidate_token).first()
        if not exists:
            return candidate_token

    # Fallback to longer token if collisions occur
    return f"KS-{date_str}-{secrets.token_hex(4).upper()}"


def validate_status_transition(
    current_status: str,
    new_status: str,
    actor_role: str,
) -> None:
    """
    Validates whether a status transition is permitted based on the current status
    and actor role. Raises HTTPException if invalid.
    """
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition from '{current_status}' to '{new_status}'. "
                f"Allowed transitions: {', '.join(allowed) if allowed else 'None (terminal state)'}."
            ),
        )

    if actor_role == "FARMER":
        if current_status != "BOOKED" or new_status != "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Farmers can only cancel bookings in 'BOOKED' status.",
            )


def build_booking_response(booking: Booking) -> dict:
    """Build a serialized dictionary for BookingResponse with joined relationships."""
    history_items = []
    for h in booking.status_history:
        history_items.append({
            "id": h.id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "note": h.note,
            "actor_name": h.actor.full_name if h.actor else "System",
            "actor_role": h.actor.role if h.actor else "SYSTEM",
            "created_at": h.created_at,
        })

    return {
        "id": booking.id,
        "public_token": booking.public_token,
        "farmer_id": booking.farmer_id,
        "farmer_name": booking.farmer.full_name if booking.farmer else "Unknown",
        "farmer_mobile": booking.farmer.mobile_number if booking.farmer else "",
        "farmer_village": booking.farmer.village if booking.farmer else None,
        "slot_id": booking.slot_id,
        "centre_id": booking.slot.centre_id if booking.slot else None,
        "centre_name": booking.slot.centre.name if booking.slot and booking.slot.centre else "Unknown",
        "centre_district": booking.slot.centre.district if booking.slot and booking.slot.centre else "",
        "centre_address": booking.slot.centre.address if booking.slot and booking.slot.centre else "",
        "slot_date": booking.slot.slot_date if booking.slot else date.today(),
        "start_time": booking.slot.start_time if booking.slot else time(0, 0),
        "end_time": booking.slot.end_time if booking.slot else time(0, 0),
        "produce_type": booking.produce_type,
        "quantity": booking.quantity,
        "quantity_unit": booking.quantity_unit,
        "status": booking.status,
        "queue_number": booking.queue_number,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
        "status_history": history_items,
    }

