from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_active_farmer, get_current_user
from app.models.user import User
from app.models.slot import ProcurementSlot
from app.models.centre import ProcurementCentre
from app.models.booking import Booking
from app.models.history import BookingStatusHistory
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingStatusHistoryResponse,
)
from app.services.booking_service import (
    get_slot_booked_count,
    generate_unique_token,
    validate_status_transition,
    build_booking_response,
    CAPACITY_CONSUMING_STATUSES,
)

router = APIRouter()


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new procurement slot booking",
)
def create_booking(
    data: BookingCreate,
    current_farmer: User = Depends(get_current_active_farmer),
    db: Session = Depends(get_db),
):
    """
    Reserve capacity atomically and generate a secure unique public token.
    Uses row-level locking (with_for_update) where supported to prevent race conditions.
    """
    # 1. Fetch and lock slot row
    slot_query = db.query(ProcurementSlot).filter(ProcurementSlot.id == data.slot_id)
    try:
        slot = slot_query.with_for_update().first()
    except Exception:
        # Fallback if dialect does not support with_for_update (e.g. SQLite test engine)
        slot = slot_query.first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested time slot was not found. (स्लॉट नहीं मिला)",
        )

    # 2. Validate slot status
    if slot.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This slot is not open for bookings (status: {slot.status}). (यह स्लॉट बुकिंग के लिए बंद है)",
        )

    if slot.slot_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book a past date slot. (पिछली तारीख के स्लॉट को बुक नहीं किया जा सकता)",
        )

    # 3. Check procurement centre status
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == slot.centre_id).first()
    if not centre or not centre.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This procurement centre is currently inactive. (यह खरीद केंद्र वर्तमान में निष्क्रिय है)",
        )

    # 4. Prevent duplicate booking for the same farmer in the same slot
    duplicate = (
        db.query(Booking.id)
        .filter(
            Booking.slot_id == slot.id,
            Booking.farmer_id == current_farmer.id,
            Booking.status.in_(CAPACITY_CONSUMING_STATUSES),
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active booking for this time slot. (आप पहले ही इस स्लॉट में बुकिंग कर चुके हैं)",
        )

    # 5. Check remaining capacity
    active_count = get_slot_booked_count(db, slot.id)
    if active_count >= slot.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot capacity has been reached. Please choose another slot. (स्लॉट की क्षमता पूरी हो चुकी है)",
        )

    # 6. Generate unique token & queue number
    public_token = generate_unique_token(db, slot.slot_date)
    max_queue = db.query(func.max(Booking.queue_number)).filter(Booking.slot_id == slot.id).scalar() or 0
    next_queue = max_queue + 1

    # 7. Create booking record
    booking = Booking(
        public_token=public_token,
        farmer_id=current_farmer.id,
        slot_id=slot.id,
        produce_type=data.produce_type,
        quantity=data.quantity,
        quantity_unit=data.quantity_unit,
        status="BOOKED",
        queue_number=next_queue,
    )
    db.add(booking)
    db.flush()

    # 8. Record audit history
    history = BookingStatusHistory(
        booking_id=booking.id,
        actor_id=current_farmer.id,
        old_status=None,
        new_status="BOOKED",
        note="Booking created by farmer",
    )
    db.add(history)
    db.commit()
    db.refresh(booking)

    return build_booking_response(booking)


@router.get(
    "/mine",
    response_model=List[BookingResponse],
    summary="List current farmer's bookings",
)
def get_my_bookings(
    current_farmer: User = Depends(get_current_active_farmer),
    db: Session = Depends(get_db),
):
    """Retrieve all bookings placed by the authenticated farmer, ordered newest first."""
    bookings = (
        db.query(Booking)
        .filter(Booking.farmer_id == current_farmer.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [build_booking_response(b) for b in bookings]


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get booking details",
)
def get_booking_details(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve booking details with status history.
    Enforces ownership: Farmers can only view their own bookings; Admins can view any.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking record not found.",
        )

    if current_user.role != "ADMIN" and booking.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this booking.",
        )

    return build_booking_response(booking)


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel own upcoming booking",
)
def cancel_my_booking(
    booking_id: UUID,
    current_farmer: User = Depends(get_current_active_farmer),
    db: Session = Depends(get_db),
):
    """
    Cancel an eligible booking.
    Farmers can only cancel their own bookings that are in 'BOOKED' status.
    Cancelling immediately frees up slot capacity.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    # Ownership check
    if booking.farmer_id != current_farmer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot cancel another farmer's booking.",
        )

    # Status check
    if booking.status != "BOOKED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel booking with status '{booking.status}'. Only pending 'BOOKED' appointments can be cancelled.",
        )

    old_status = booking.status
    booking.status = "CANCELLED"

    history = BookingStatusHistory(
        booking_id=booking.id,
        actor_id=current_farmer.id,
        old_status=old_status,
        new_status="CANCELLED",
        note="Cancelled by farmer via portal",
    )
    db.add(history)
    db.commit()
    db.refresh(booking)

    return build_booking_response(booking)


@router.get(
    "/{booking_id}/history",
    response_model=List[BookingStatusHistoryResponse],
    summary="Get status change audit trail for a booking",
)
def get_booking_history(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the audit history of status changes for a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if current_user.role != "ADMIN" and booking.farmer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    history_items = []
    for h in booking.status_history:
        history_items.append(
            BookingStatusHistoryResponse(
                id=h.id,
                old_status=h.old_status,
                new_status=h.new_status,
                note=h.note,
                actor_name=h.actor.full_name if h.actor else "System",
                actor_role=h.actor.role if h.actor else "SYSTEM",
                created_at=h.created_at,
            )
        )
    return history_items

