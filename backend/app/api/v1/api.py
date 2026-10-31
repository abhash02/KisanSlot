from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, admin, centres, bookings

api_router = APIRouter()

# Health router
api_router.include_router(health.router, tags=["Health"])

# Authentication router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Admin router
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Public / Farmer Centres router
api_router.include_router(centres.router, prefix="/centres", tags=["Centres & Slots"])

# Farmer Bookings router
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
