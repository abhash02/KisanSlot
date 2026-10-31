from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CentreBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Centre name")
    district: str = Field(..., min_length=2, max_length=100, description="District / Region")
    address: str = Field(..., min_length=5, description="Full address or landmark")
    notes: Optional[str] = Field(None, max_length=500, description="Operating notes or guidelines")
    is_active: bool = Field(default=True, description="Whether centre is currently accepting bookings")

    @field_validator("name", "district")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Field must contain at least 2 characters")
        return trimmed


class CentreCreate(CentreBase):
    pass


class CentreUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, min_length=5)
    notes: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

    @field_validator("name", "district", mode="before")
    @classmethod
    def strip_if_present(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if len(trimmed) < 2:
                raise ValueError("Field must contain at least 2 characters")
            return trimmed
        return v


class CentreResponse(CentreBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    total_slots: Optional[int] = 0
    active_slots: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

