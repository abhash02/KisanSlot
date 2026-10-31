import re
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict


def normalize_mobile_number(v: str) -> str:
    """
    Sanitize and validate a 10-digit Indian mobile number.
    Accepts formats like '+91 9876543210', '09876543210', '98765-43210'.
    Returns canonical 10-digit string.
    """
    if not isinstance(v, str):
        raise ValueError("Mobile number must be a string")
    
    cleaned = re.sub(r"[\s\-\(\)\.]+", "", v)
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]

    if not re.match(r"^[6-9]\d{9}$", cleaned):
        raise ValueError(
            "Mobile number must be a valid 10-digit Indian number starting with 6-9 (मान्य 10 अंकों का मोबाइल नंबर दर्ज करें)"
        )
    return cleaned


class FarmerRegisterRequest(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Farmer's full name",
        json_schema_extra={"example": "Ramesh Kumar"},
    )
    mobile_number: str = Field(
        ...,
        description="10-digit mobile number",
        json_schema_extra={"example": "9876543210"},
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=100,
        description="Account password (min 6 characters)",
        json_schema_extra={"example": "securePass123"},
    )
    village: Optional[str] = Field(
        None,
        max_length=100,
        description="Village or locality",
        json_schema_extra={"example": "Rampur"},
    )
    preferred_language: str = Field(
        default="hi",
        pattern="^(hi|en)$",
        description="Preferred interface language ('hi' or 'en')",
    )

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Name must be at least 2 characters long")
        return trimmed

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile_number(v)


class LoginRequest(BaseModel):
    mobile_number: str = Field(
        ...,
        description="10-digit mobile number",
        json_schema_extra={"example": "9876543210"},
    )
    password: str = Field(
        ...,
        min_length=1,
        description="Account password",
        json_schema_extra={"example": "securePass123"},
    )

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile_number(v)


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    mobile_number: str
    role: str
    village: Optional[str] = None
    preferred_language: str = "hi"
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None

