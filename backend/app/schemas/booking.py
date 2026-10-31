from datetime import date, time, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator

VALID_PRODUCE_TYPES = ["Wheat", "Rice/Paddy", "Maize", "Mustard", "Potato", "Other"]
VALID_BOOKING_STATUSES = ["BOOKED", "ARRIVED", "IN_SERVICE", "COMPLETED", "CANCELLED", "REJECTED"]


class BookingCreate(BaseModel):
    slot_id: UUID = Field(..., description="Target procurement slot UUID")
    produce_type: str = Field(..., description="Crop/produce type")
    quantity: float = Field(..., gt=0, description="Quantity in quintals (must be positive)")
    quantity_unit: str = Field(default="quintal", description="Unit of measurement (default: quintal)")

    @field_validator("produce_type")
    @classmethod
    def validate_produce(cls, v: str) -> str:
        trimmed = v.strip()
        matched = next((pt for pt in VALID_PRODUCE_TYPES if pt.lower() == trimmed.lower()), None)
        if not matched:
            valid_str = ", ".join(VALID_PRODUCE_TYPES)
            raise ValueError(f"Produce type must be one of: {valid_str}")
        return matched


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status")
    note: Optional[str] = Field(None, max_length=500, description="Reason or operational note")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        upper = v.strip().upper()
        if upper not in VALID_BOOKING_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(VALID_BOOKING_STATUSES)}")
        return upper


class BookingStatusHistoryResponse(BaseModel):
    id: UUID
    old_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingResponse(BaseModel):
    id: UUID
    public_token: str
    farmer_id: UUID
    farmer_name: str
    farmer_mobile: str
    farmer_village: Optional[str] = None
    slot_id: UUID
    centre_id: UUID
    centre_name: str
    centre_district: str
    centre_address: str
    slot_date: date
    start_time: time
    end_time: time
    produce_type: str
    quantity: float
    quantity_unit: str
    status: str
    queue_number: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    status_history: List[BookingStatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BookingListResponse(BaseModel):
    items: List[BookingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

