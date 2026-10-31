from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import (
    FarmerRegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new farmer account",
)
def register_farmer(
    data: FarmerRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new farmer account.
    Validates mobile number format, verifies uniqueness, hashes password with Argon2,
    and returns a signed JWT access token.
    """
    # Check duplicate mobile number
    existing_user = db.query(User).filter(User.mobile_number == data.mobile_number).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already registered. Please sign in instead. (यह मोबाइल नंबर पहले से पंजीकृत है, कृपया लॉगिन करें)",
        )

    # Hash password with Argon2
    hashed_pwd = get_password_hash(data.password)

    # Create farmer user
    user = User(
        full_name=data.full_name,
        mobile_number=data.mobile_number,
        password_hash=hashed_pwd,
        role="FARMER",
        village=data.village,
        preferred_language=data.preferred_language,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT token
    token = create_access_token(
        subject=user.id,
        role=user.role,
        mobile=user.mobile_number,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate farmer or admin user",
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user using mobile number and password.
    Supports both Farmer and Admin credentials.
    """
    user = db.query(User).filter(User.mobile_number == data.mobile_number).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number or password. (अमान्य मोबाइल नंबर या पासवर्ड)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact support. (आपका खाता निष्क्रिय कर दिया गया है)",
        )

    token = create_access_token(
        subject=user.id,
        role=user.role,
        mobile=user.mobile_number,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Returns the profile of the currently signed-in user."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Sign out user session",
)
def logout(
    current_user: User = Depends(get_current_user),
):
    """
    Signs out the current user session.
    Instructs client to remove token from active memory.
    """
    return MessageResponse(
        message="Signed out successfully. (सफलतापूर्वक लॉगआउट किया गया)",
        detail=f"Session terminated for user {current_user.mobile_number}",
    )

