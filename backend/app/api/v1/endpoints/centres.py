from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db
from app.models.centre import ProcurementCentre
from app.models.slot import ProcurementSlot
from app.schemas.centre import CentreResponse
from app.schemas.slot import SlotResponse
from app.services.booking_service import get_slot_booked_count, get_slot_remaining_capacity

router = APIRouter()


@router.get("", response_model=List[CentreResponse], summary="List active procurement centres")
def list_active_centres(
    district: Optional[str] = Query(None, description="Filter by district"),
    q: Optional[str] = Query(None, description="Search by centre name or landmark"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint for farmers to browse active procurement centres.
    Enriched with counts of active upcoming slots.
    """
    query = db.query(ProcurementCentre).filter(ProcurementCentre.is_active == True)

    if district:
        query = query.filter(ProcurementCentre.district.ilike(f"%{district.strip()}%"))
    if q:
        query = query.filter(
            (ProcurementCentre.name.ilike(f"%{q.strip()}%"))
            | (ProcurementCentre.address.ilike(f"%{q.strip()}%"))
        )

    centres = query.order_by(ProcurementCentre.district, ProcurementCentre.name).all()

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


@router.get("/{centre_id}", response_model=CentreResponse, summary="Get centre details")
def get_centre_details(
    centre_id: UUID,
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific procurement centre."""
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement centre not found. (खरीद केंद्र नहीं मिला)",
        )
    return CentreResponse.model_validate(centre)


@router.get("/{centre_id}/slots", response_model=List[SlotResponse], summary="List available slots for a centre")
def list_centre_slots(
    centre_id: UUID,
    slot_date: Optional[date] = Query(None, alias="date", description="Specific slot date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """
    List open, bookable slots for a procurement centre with real-time remaining capacity.
    Past dates and closed/cancelled slots are excluded for farmer booking.
    """
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procurement centre not found.",
        )

    today = date.today()
    query = db.query(ProcurementSlot).filter(
        ProcurementSlot.centre_id == centre_id,
        ProcurementSlot.status == "OPEN",
    )

    if slot_date:
        query = query.filter(ProcurementSlot.slot_date == slot_date)
    else:
        # Default to upcoming dates
        query = query.filter(ProcurementSlot.slot_date >= today)

    slots = query.order_by(ProcurementSlot.slot_date, ProcurementSlot.start_time).all()

    results = []
    for s in slots:
        booked = get_slot_booked_count(db, s.id)
        remaining = max(0, s.capacity - booked)

        results.append(
            SlotResponse(
                id=s.id,
                centre_id=s.centre_id,
                centre_name=centre.name,
                district=centre.district,
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

