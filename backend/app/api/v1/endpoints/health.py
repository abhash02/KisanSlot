import logging
from fastapi import APIRouter, status, Response
from sqlalchemy import text
from app.db.session import engine
from app.schemas.health import HealthResponse
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(response: Response):
    """
    Health check endpoint.
    Verifies service status and PostgreSQL database connectivity.
    """
    db_status = "connected"
    db_error = None
    overall_status = "healthy"

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = "disconnected"
        db_error = f"Database unreachable: {str(exc).splitlines()[0] if str(exc) else 'Connection error'}"
        overall_status = "degraded"
        # We set 503 Service Unavailable when DB is down so load balancers / health checks notice,
        # but return a structured JSON response.
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        logger.warning(f"Database health check failed: {exc}")

    return HealthResponse(
        status=overall_status,
        app=settings.APP_NAME,
        version="0.1.0",
        environment=settings.ENVIRONMENT,
        database=db_status,
        database_error=db_error,
    )

