from datetime import date, time, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, model_validator


class SlotBase(BaseModel):
    centre_id: UUID = Field(..., description="Target procurement centre UUID")
    slot_date: date = Field(..., description="Date of the slot (YYYY-MM-DD)")
    start_time: time = Field(..., description="Starting time (HH:MM:SS)")
    end_time: time = Field(..., description="Ending time (HH:MM:SS)")
    capacity: int = Field(..., gt=0, description="Maximum active bookings allowed for this slot")
    status: str = Field(default="OPEN", pattern="^(OPEN|CLOSED|CANCELLED)$")
    notes: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_times_and_dates(self):
        if self.start_time >= self.end_time:
            raise ValueError("Start time must precede end time (प्रारंभ समय समाप्ति समय से पहले होना चाहिए)")
        return self


class SlotCreate(SlotBase):
    @model_validator(mode="after")
    def validate_not_past(self):
        if self.slot_date < date.today():
            raise ValueError("Slot date cannot be in the past (पिछली तारीख का स्लॉट नहीं बनाया जा सकता)")
        return self


class SlotUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    capacity: Optional[int] = Field(None, gt=0)
    status: Optional[str] = Field(None, pattern="^(OPEN|CLOSED|CANCELLED)$")
    notes: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_times(self):
        if self.start_time is not None and self.end_time is not None:
            if self.start_time >= self.end_time:
                raise ValueError("Start time must precede end time")
        return self


class SlotResponse(BaseModel):
    id: UUID
    centre_id: UUID
    centre_name: Optional[str] = None
    district: Optional[str] = None
    slot_date: date
    start_time: time
    end_time: time
    capacity: int
    booked_count: int = 0
    remaining_capacity: int = 0
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

