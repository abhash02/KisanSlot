import math
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.api.deps import get_db, get_current_active_admin
from app.models.user import User
from app.models.centre import ProcurementCentre
from app.models.slot import ProcurementSlot
from app.models.booking import Booking
from app.models.history import BookingStatusHistory
from app.schemas.centre import CentreCreate, CentreUpdate, CentreResponse
from app.schemas.slot import SlotCreate, SlotUpdate, SlotResponse
from app.schemas.booking import (
    BookingResponse,
    BookingStatusUpdate,
    BookingListResponse,
)
from app.services.booking_service import (
    get_slot_booked_count,
    get_slot_remaining_capacity,
    check_slot_overlap,
    validate_status_transition,
    build_booking_response,
    CAPACITY_CONSUMING_STATUSES,
)

router = APIRouter()


# -----------------------------------------------------------------------------
# Admin System & Summary
# -----------------------------------------------------------------------------

@router.get("/verify", summary="Verify admin permissions")
def verify_admin(current_admin: User = Depends(get_current_active_admin)):
    """Protected endpoint accessible only by users with ADMIN role."""
    return {
        "verified": True,
        "admin_id": str(current_admin.id),
        "name": current_admin.full_name,
        "mobile": current_admin.mobile_number,
        "role": current_admin.role,
    }


@router.get("/summary", summary="Get dashboard summary counts")
def get_admin_summary(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """
    Returns live statistics for the admin dashboard:
    total farmers, active centres, total slots, active bookings, completed bookings.
    """
    total_farmers = db.query(func.count(User.id)).filter(User.role == "FARMER").scalar() or 0
    total_centres = db.query(func.count(ProcurementCentre.id)).filter(ProcurementCentre.is_active == True).scalar() or 0
    total_slots = db.query(func.count(ProcurementSlot.id)).scalar() or 0
    active_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.status.in_(CAPACITY_CONSUMING_STATUSES))
        .scalar()
        or 0
    )
    completed_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.status == "COMPLETED")
        .scalar()
        or 0
    )

    return {
        "total_farmers": total_farmers,
        "active_centres": total_centres,
        "total_slots": total_slots,
        "total_bookings": active_bookings,
        "completed_bookings": completed_bookings,
    }


# -----------------------------------------------------------------------------
# Centre Management
# -----------------------------------------------------------------------------

@router.post(
    "/centres",
    response_model=CentreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new procurement centre",
)
def create_centre(
    data: CentreCreate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Create a new procurement centre."""
    centre = ProcurementCentre(
        name=data.name,
        district=data.district,
        address=data.address,
        notes=data.notes,
        is_active=data.is_active,
    )
    db.add(centre)
    db.commit()
    db.refresh(centre)
    return CentreResponse.model_validate(centre)


@router.get(
    "/centres",
    response_model=List[CentreResponse],
    summary="List all procurement centres for management",
)
def list_admin_centres(
    district: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """List all centres with active slot counts, including inactive centres for admin review."""
    query = db.query(ProcurementCentre)
    if district:
        query = query.filter(ProcurementCentre.district.ilike(f"%{district.strip()}%"))
    if is_active is not None:
        query = query.filter(ProcurementCentre.is_active == is_active)

    centres = query.order_by(ProcurementCentre.created_at.desc()).all()

    today = date.today()
    results = []
    for c in centres:
        active_slots_count = (
            db.query(func.count(ProcurementSlot.id))
            .filter(
                ProcurementSlot.centre_id == c.id,
                ProcurementSlot.status == "OPEN",
                ProcurementSlot.slot_date >= today,
            )
            .scalar()
            or 0
        )
        total_slots_count = (
            db.query(func.count(ProcurementSlot.id))
            .filter(ProcurementSlot.centre_id == c.id)
            .scalar()
            or 0
        )
        resp = CentreResponse.model_validate(c)
        resp.active_slots = active_slots_count
        resp.total_slots = total_slots_count
        results.append(resp)

    return results


@router.patch(
    "/centres/{centre_id}",
    response_model=CentreResponse,
    summary="Update or activate/deactivate a procurement centre",
)
def update_centre(
    centre_id: UUID,
    data: CentreUpdate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Update centre details or toggle active status."""
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Centre not found.")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(centre, field, value)

    db.commit()
    db.refresh(centre)
    return CentreResponse.model_validate(centre)


# -----------------------------------------------------------------------------
# Slot Management
# -----------------------------------------------------------------------------

@router.post(
    "/slots",
    response_model=SlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new procurement slot",
)
def create_slot(
    data: SlotCreate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """
    Create a slot. Validates:
    - Centre exists and is active.
    - Slot date is not in the past.
    - Start time precedes end time.
    - Slot does not overlap with an existing slot at the same centre on the same date.
    """
    # 1. Verify centre exists and is active
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == data.centre_id).first()
    if not centre:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Centre not found.")
    if not centre.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create slots for an inactive procurement centre. (निष्क्रिय केंद्र के लिए स्लॉट नहीं बनाया जा सकता)",
        )

    # 2. Check for overlapping slots
    if check_slot_overlap(db, data.centre_id, data.slot_date, data.start_time, data.end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"An overlapping slot already exists for centre '{centre.name}' on {data.slot_date}. "
                "Please choose non-conflicting hours. (इस केंद्र पर इस समय का स्लॉट पहले से मौजूद है)"
            ),
        )

    # 3. Create slot
    slot = ProcurementSlot(
        centre_id=data.centre_id,
        slot_date=data.slot_date,
        start_time=data.start_time,
        end_time=data.end_time,
        capacity=data.capacity,
        status=data.status,
        notes=data.notes,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    return SlotResponse(
        id=slot.id,
        centre_id=slot.centre_id,
        centre_name=centre.name,
        district=centre.district,
        slot_date=slot.slot_date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        capacity=slot.capacity,
        booked_count=0,
        remaining_capacity=slot.capacity,
        status=slot.status,
        notes=slot.notes,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
    )


@router.get(
    "/slots",
    response_model=List[SlotResponse],
    summary="List all slots for management",
)
def list_admin_slots(
    centre_id: Optional[UUID] = Query(None),
    slot_date: Optional[date] = Query(None, alias="date"),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """List slots with capacity calculations for admin management."""
    query = db.query(ProcurementSlot)
    if centre_id:
        query = query.filter(ProcurementSlot.centre_id == centre_id)
    if slot_date:
        query = query.filter(ProcurementSlot.slot_date == slot_date)
    if status_filter:
        query = query.filter(ProcurementSlot.status == status_filter)

    slots = query.order_by(ProcurementSlot.slot_date.desc(), ProcurementSlot.start_time.asc()).all()

    results = []
    for s in slots:
        booked = get_slot_booked_count(db, s.id)
        remaining = max(0, s.capacity - booked)
        results.append(
            SlotResponse(
                id=s.id,
                centre_id=s.centre_id,
                centre_name=s.centre.name if s.centre else "Unknown",
                district=s.centre.district if s.centre else "",
                slot_date=s.slot_date,
                start_time=s.start_time,
                end_time=s.end_time,
                capacity=s.capacity,
                booked_count=booked,
                remaining_capacity=remaining,
                status=s.status,
                notes=s.notes,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
        )
    return results


@router.patch(
    "/slots/{slot_id}",
    response_model=SlotResponse,
    summary="Update or close/cancel a slot",
)
def update_slot(
    slot_id: UUID,
    data: SlotUpdate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """
    Update a slot. Validates:
    - Capacity cannot be reduced below current active bookings.
    - New start/end times do not overlap with existing slots.
    """
    slot = db.query(ProcurementSlot).filter(ProcurementSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found.")

    active_bookings = get_slot_booked_count(db, slot.id)

    # 1. Capacity reduction check
    if data.capacity is not None and data.capacity < active_bookings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot reduce slot capacity to {data.capacity}. "
                f"There are currently {active_bookings} active farmer bookings in this slot."
            ),
        )

    # 2. Overlap check if times are modified
    new_start = data.start_time or slot.start_time
    new_end = data.end_time or slot.end_time
    if data.start_time is not None or data.end_time is not None:
        if check_slot_overlap(
            db, slot.centre_id, slot.slot_date, new_start, new_end, exclude_slot_id=slot.id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Updated times cause an overlap with another existing slot at this centre.",
            )

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(slot, field, value)

    db.commit()
    db.refresh(slot)

    booked = get_slot_booked_count(db, slot.id)
    return SlotResponse(
        id=slot.id,
        centre_id=slot.centre_id,
        centre_name=slot.centre.name if slot.centre else "Unknown",
        district=slot.centre.district if slot.centre else "",
        slot_date=slot.slot_date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        capacity=slot.capacity,
        booked_count=booked,
        remaining_capacity=max(0, slot.capacity - booked),
        status=slot.status,
        notes=slot.notes,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
    )


# -----------------------------------------------------------------------------
# Booking & Queue Management
# -----------------------------------------------------------------------------

@router.get(
    "/bookings",
    response_model=BookingListResponse,
    summary="Search, filter, and paginate all bookings",
)
def list_admin_bookings(
    centre_id: Optional[UUID] = Query(None),
    booking_date: Optional[date] = Query(None, alias="date"),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None, description="Search token, farmer name, or mobile"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Admin queue view: Paginated, searchable list of all bookings across centres."""
    query = db.query(Booking).join(Booking.slot).join(Booking.farmer)

    if centre_id:
        query = query.filter(ProcurementSlot.centre_id == centre_id)
    if booking_date:
        query = query.filter(ProcurementSlot.slot_date == booking_date)
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Booking.public_token.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.mobile_number.ilike(search_pattern),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    bookings = (
        query.order_by(ProcurementSlot.slot_date.desc(), Booking.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [build_booking_response(b) for b in bookings]
    return BookingListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/bookings/{booking_id}",
    response_model=BookingResponse,
    summary="Get full booking details and audit history",
)
def get_admin_booking_detail(
    booking_id: UUID,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """Retrieve booking details with status audit history for queue operator."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    return build_booking_response(booking)


@router.patch(
    "/bookings/{booking_id}/status",
    response_model=BookingResponse,
    summary="Update queue/service status for a booking",
)
def update_booking_status(
    booking_id: UUID,
    data: BookingStatusUpdate,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    """
    Advance booking through the queue workflow:
    BOOKED -> ARRIVED -> IN_SERVICE -> COMPLETED.
    Allows CANCELLED or REJECTED with note.
    Records every transition in BookingStatusHistory.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    old_status = booking.status
    new_status = data.status

    # Validate transition
    validate_status_transition(old_status, new_status, actor_role="ADMIN")

    if new_status in ("CANCELLED", "REJECTED") and not data.note:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A reason or note is required when cancelling or rejecting a booking.",
        )

    booking.status = new_status

    history = BookingStatusHistory(
        booking_id=booking.id,
        actor_id=current_admin.id,
        old_status=old_status,
        new_status=new_status,
        note=data.note or f"Status updated to {new_status} by officer {current_admin.full_name}",
    )
    db.add(history)
    db.commit()
    db.refresh(booking)

    return build_booking_response(booking)
